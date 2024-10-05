import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-arrow-spinner',
  templateUrl: './arrow-spinner.component.html',
  styleUrls: ['./arrow-spinner.component.scss']
})
export class ArrowSpinnerComponent implements OnInit {
  rotationDegrees: number = 0;
  spinning: boolean = false;
  newName: string = '';
  newQuestion: string = '';
  manualDegree: number = 0;
  names: string[] = [];
  questions: string[] = [
    "What is your favorite hobby?",
    "What's the most interesting place you've visited?",
    "What is your dream job?",
    "Who is your role model?",
    "What is your favorite movie?",
    "What is the weirdest food you've ever eaten?",
    "If you could live anywhere in the world, where would it be?",
    "What's one thing you couldn't live without?",
    "What's your favorite book?",
    "What's one thing you're afraid of?"
  ];
  usedQuestions: { [key: string]: boolean } = {};
  selectedQuestion: string = '';
  selectedAsker: string = '';
  selectedResponder: string = '';
  questionHistory: { [key: string]: string[] } = {};
  isHistoryLoaded: boolean = false;
  recentResponders: number[] = [];
  errorMessage: string = '';
  initialized: boolean = false;

  @ViewChild('arrow') arrowElement!: ElementRef;

  constructor(private firestore: AngularFirestore) { }

  ngOnInit() {
    // Subscribe to currentSpin document
    this.firestore.collection('spins').doc('currentSpin').valueChanges().subscribe((spin: any) => {
      if (spin) {
        this.rotationDegrees = spin.rotationDegrees || 0;
        this.selectedAsker = spin.asker || '';
        this.selectedResponder = spin.responder || '';
        this.selectedQuestion = spin.question || '';
        if (!this.initialized) {
          this.initialized = true;
        }
      }
    });

    // Subscribe to currentNames document
    this.firestore.collection('names').doc('currentNames').valueChanges().subscribe((data: any) => {
      if (data && data.names) {
        this.names = data.names;
      }
    });

    // Subscribe to currentQuestions document
    this.firestore.collection('questions').doc('currentQuestions').valueChanges().subscribe((data: any) => {
      if (data && data.questions) {
        this.questions = data.questions;
      }
    });

    // Subscribe to questionHistory document
    this.firestore.collection('questionHistory').doc('history').valueChanges().subscribe((data: any) => {
      if (data && data.history) {
        this.questionHistory = data.history;
        this.isHistoryLoaded = true;
      } else {
        this.isHistoryLoaded = true;
      }
    });

    // Initialize usedQuestions document
    this.firestore.collection('questions').doc('usedQuestions').get().subscribe((docSnapshot: any) => {
      if (docSnapshot.exists) {
        this.firestore.collection('questions').doc('usedQuestions').valueChanges().subscribe((data: any) => {
          if (data && data.usedQuestions) {
            this.usedQuestions = data.usedQuestions;
          }
        });
      } else {
        this.firestore.collection('questions').doc('usedQuestions').set({
          usedQuestions: {}
        });
      }
    });
  }

  /**
   * Adds a new question to the questions list and updates Firestore.
   */
  addQuestion() {
    if (this.newQuestion.trim()) {
      this.questions.push(this.newQuestion);
      const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
      questionsRef.set(
        { questions: firebase.firestore.FieldValue.arrayUnion(this.newQuestion) },
        { merge: true }
      );
      this.newQuestion = '';
    }
  }

  /**
   * Adds a new name to the names list and updates Firestore.
   */
  addName() {
    if (this.newName) {
      const namesRef = this.firestore.collection('names').doc('currentNames');
      namesRef.set(
        { names: firebase.firestore.FieldValue.arrayUnion(this.newName) },
        { merge: true }
      );
      this.newName = '';
    }
  }

  /**
   * Deletes a name from the names list based on its index and updates Firestore.
   * @param index The index of the name to delete.
   */
  deleteName(index: number) {
    const nameToDelete = this.names[index];
    const namesRef = this.firestore.collection('names').doc('currentNames');
    namesRef.update({
      names: firebase.firestore.FieldValue.arrayRemove(nameToDelete)
    });
  }

  /**
   * Gets the number of remaining unused questions.
   */
  get remainingQuestions(): number {
    return this.questions.filter(q => !this.usedQuestions[q]).length;
  }

  /**
   * Rotates the spinner to a specified degree manually.
   */
  rotateToDegree() {
    if (this.spinning) return;
    const offset = 270;
    const adjustedDegrees = (this.manualDegree + offset) % 360;
    this.rotationDegrees += adjustedDegrees;
    this.spinning = true;
    this.firestore.collection('spins').doc('currentSpin').set({
      rotationDegrees: this.rotationDegrees
    }).then(() => {
      this.spinning = false;
    }).catch(() => {
      this.errorMessage = 'Failed to rotate manually. Please try again.';
      this.spinning = false;
    });
  }

  /**
   * Initiates the spinning process to select a responder and a question.
   */
  spin() {
    if (!this.isHistoryLoaded || this.spinning) return;
    if (!this.names || this.names.length <= 1) return;
    this.spinning = true;
    this.selectedQuestion = '';
    this.selectedResponder = '';
    this.selectedAsker = '';
    this.errorMessage = '';
    let randomIndexResponder = Math.floor(Math.random() * this.names.length);
    const selectedName = this.names[randomIndexResponder];
    const degreesPerName = 360 / this.names.length;
    const targetRotation = (degreesPerName * randomIndexResponder) % 360;
    const currentRotation = this.rotationDegrees % 360;
    const targetRotationRelative = (targetRotation - currentRotation + 360) % 360;
    const totalRotation = this.rotationDegrees + (360 * 5) + targetRotationRelative;
    this.rotationDegrees = totalRotation;
    const spinRef = this.firestore.collection('spins').doc('currentSpin');
    spinRef.set({
      rotationDegrees: this.rotationDegrees,
      responder: selectedName,
      asker: '',
      question: ''
    }).catch(() => {
      this.errorMessage = 'Failed to initiate spin. Please try again.';
      this.spinning = false;
    });
  }

  /**
   * Handles actions to perform when spinning ends, such as selecting a question and deleting it.
   */
  onSpinEnd() {
    if (!this.spinning) return;
    try {
      const selectedName = this.getSelectedName();
      this.selectedResponder = selectedName;

      // Select a random asker different from the responder
      let randomIndexAsker: number;
      do {
        randomIndexAsker = Math.floor(Math.random() * this.names.length);
      } while (this.names[randomIndexAsker] === selectedName);
      this.selectedAsker = this.names[randomIndexAsker];

      // Update recent responders
      this.recentResponders.push(this.names.indexOf(selectedName));
      if (this.recentResponders.length > 3) this.recentResponders.shift();

      // Filter available questions
      const availableQuestions = this.questions.filter(q => !this.usedQuestions[q]);
      if (availableQuestions.length === 0) {
        this.selectedQuestion = 'No questions available.';
        this.spinning = false;
        return;
      }

      // Select a random question from available questions
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      this.selectedQuestion = randomQuestion;

      // Mark the question as used
      this.usedQuestions[randomQuestion] = true;

      // **Delete the used question**
      this.deleteUsedQuestion(randomQuestion);

      // Update Firestore with the new spin details
      const spinRef = this.firestore.collection('spins').doc('currentSpin');
      spinRef.update({
        asker: this.selectedAsker,
        question: this.selectedQuestion
      }).then(() => {
        this.spinning = false;
      }).catch(() => {
        this.errorMessage = 'Failed to update spin details. Please try again.';
        this.spinning = false;
      });

    } catch (error) {
      console.error('Error in onSpinEnd:', error);
      this.errorMessage = 'An unexpected error occurred. Please try again.';
      this.spinning = false;
    }
  }

  /**
   * Retrieves the selected name based on the current rotation degrees.
   */
  getSelectedName(): string {
    const degreesPerName = 360 / this.names.length;
    const finalRotation = this.rotationDegrees % 360;
    const selectedIndex = Math.floor((finalRotation + degreesPerName / 2) / degreesPerName) % this.names.length;
    return this.names[selectedIndex];
  }

  /**
   * Calculates the position of each name on the spinner based on its index.
   * @param index The index of the name.
   * @param name The name string.
   */
  getDegreePosition(index: number, name: string): { [key: string]: string } {
    const total = this.names.length;
    const angle = (360 / total) * index;
    const radius = 309;
    return {
      transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`
    };
  }

  /**
   * Marks all questions as read except one randomly selected question.
   * Useful for managing question availability.
   */
  markAllAsReadExceptOne() {
    if (this.questions.length <= 1) return;
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    const questionToRemainUnread = this.questions[randomIndex];
    const updatedUsedQuestions: { [key: string]: boolean } = {};
    this.questions.forEach(question => {
      updatedUsedQuestions[question] = (question !== questionToRemainUnread);
    });
    this.usedQuestions = updatedUsedQuestions;
    this.firestore.collection('questions').doc('usedQuestions').set(this.usedQuestions);
  }

  /**
   * Marks all questions as unread, resetting the usedQuestions mapping.
   */
  markAllAsUnread() {
    const updatedUsedQuestions: { [key: string]: boolean } = {};
    this.questions.forEach(question => {
      updatedUsedQuestions[question] = false;
    });
    this.usedQuestions = updatedUsedQuestions;
    this.firestore.collection('questions').doc('usedQuestions').set(updatedUsedQuestions);
  }

  /**
   * **New Method**
   * Deletes a used question from the questions array and updates Firestore.
   * @param question The question to be deleted.
   */
  deleteUsedQuestion(question: string) {
    // Remove the question from the local questions array
    this.questions = this.questions.filter(q => q !== question);

    // Update Firestore by removing the question from `currentQuestions`
    const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
    questionsRef.set(
      { questions: firebase.firestore.FieldValue.arrayRemove(question) },
      { merge: true }
    ).then(() => {
      console.log(`Question "${question}" has been deleted successfully.`);
    }).catch(error => {
      console.error('Error deleting the question:', error);
      this.errorMessage = 'Failed to delete the used question. Please try again.';
    });
  }

  /**
   * **New Method (Optional)**
   * Resets all questions to be available again.
   * This method can be called based on application logic, such as after all questions have been used.
   */
  resetQuestions() {
    const allQuestions = [
      "What is your favorite hobby?",
      "What's the most interesting place you've visited?",
      "What is your dream job?",
      "Who is your role model?",
      "What is your favorite movie?",
      "What is the weirdest food you've ever eaten?",
      "If you could live anywhere in the world, where would it be?",
      "What's one thing you couldn't live without?",
      "What's your favorite book?",
      "What's one thing you're afraid of?"
    ];

    // Update local state
    this.questions = [...allQuestions];
    this.usedQuestions = {};

    // Update Firestore
    const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
    questionsRef.set({ questions: allQuestions }, { merge: true });

    const usedQuestionsRef = this.firestore.collection('questions').doc('usedQuestions');
    usedQuestionsRef.set({ usedQuestions: {} }, { merge: true });

    console.log('All questions have been reset.');
  }
}
