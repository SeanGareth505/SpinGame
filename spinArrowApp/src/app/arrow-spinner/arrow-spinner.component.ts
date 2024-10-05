import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-arrow-spinner',
  templateUrl: './arrow-spinner.component.html',
  styleUrls: ['./arrow-spinner.component.scss']
})
export class ArrowSpinnerComponent {
  rotationDegrees: number = 0;
  inputDegree: number = 0;  // New variable to hold the input degree value
  newName: string = '';
  names: string[] = [];
  previousIndex: number | null = null;
  previousResponder: number | null = null;
  selectedQuestion: string = '';
  selectedAsker: string = '';
  selectedResponder: string = '';
  newQuestion: string = '';
  questionHistory: { [key: string]: string[] } = {};
  usedQuestions: { [key: string]: boolean } = {};
  isHistoryLoaded: boolean = false;
  spinning: boolean = false;
  recentAskers: number[] = [];
  manualDegree: number = 0;

  recentResponders: number[] = [];

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

  constructor(private firestore: AngularFirestore) { }

  ngOnInit() {
    // Sync spin data from Firestore
    this.firestore.collection('spins').doc('currentSpin').valueChanges().subscribe((spin: any) => {
      if (spin) {
        this.rotationDegrees = spin.rotationDegrees;
        this.selectedAsker = spin.asker;
        this.selectedResponder = spin.responder;
        this.selectedQuestion = spin.question;
      }
    });

    // Sync names from Firestore and ensure they are in the correct order
    this.firestore.collection('names').doc('currentNames').valueChanges().subscribe((data: any) => {
      if (data && data.names) {
        // Ensure "Nag" is at 0 degrees, followed by other names in correct order
        const correctOrder = ['Nag', 'Cabby', 'Shockei', 'Shoddy', 'Stalker', 'Astro', 'Tangi', 'Nickname'];
        // Sorting the names based on correctOrder
        this.names = correctOrder.filter(name => data.names.includes(name));
        console.log('Correctly ordered names:', this.names);
      }
    });

    // Sync questions from Firestore
    this.firestore.collection('questions').doc('currentQuestions').valueChanges().subscribe((data: any) => {
      if (data && data.questions) {
        this.questions = data.questions;
      }
    });

    // Sync question history from Firestore
    this.firestore.collection('questionHistory').doc('history').valueChanges().subscribe((data: any) => {
      if (data && data.history) {
        this.questionHistory = data.history;
        this.isHistoryLoaded = true;
      } else {
        this.isHistoryLoaded = true;
      }
    });

    // Sync used questions from Firestore
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

  deleteName(index: number) {
    const nameToDelete = this.names[index];
    const namesRef = this.firestore.collection('names').doc('currentNames');
    namesRef.update({
      names: firebase.firestore.FieldValue.arrayRemove(nameToDelete)
    });
  }

  get remainingQuestions(): number {
    const remaining = this.questions.filter(q => !this.usedQuestions[q]).length;
    return remaining;
  }

  // Method to rotate arrow to a specific degree manually
  rotateToDegree() {
    const offset = 270; // Adjusting to make 0 degrees at the top
    const adjustedDegrees = (this.manualDegree + offset) % 360; // Ensure the degree is within the 0-360 range

    this.rotationDegrees = adjustedDegrees;

    this.firestore.collection('spins').doc('currentSpin').set({
      rotationDegrees: this.rotationDegrees
    }).then(() => {
      console.log('Manually set rotation to:', this.rotationDegrees);
    }).catch((error) => {
      console.error('Error setting rotation degree:', error);
    });
  }

  spin() {
    if (!this.isHistoryLoaded || this.spinning) return;  // Prevent multiple spins or if history isn't loaded

    if (!this.names || this.names.length <= 1) return;

    this.spinning = true;  // Set the flag to indicate spinning is in progress

    let randomIndexAsker: number;
    let randomIndexResponder: number;

    // Randomly select the responder, which is the person the arrow will land on
    randomIndexResponder = Math.floor(Math.random() * this.names.length);

    const degreesPerName = 360 / this.names.length;
    const offset = 0;  // No offset, since 0 degrees should be at the top now
    const targetRotation = (degreesPerName * randomIndexResponder + offset) % 360;  // Calculate the correct degree

    // Log the degree it's meant to go to and the name
    console.log(`Arrow should land at degree: ${targetRotation} for name: ${this.names[randomIndexResponder]}`);

    // Instantly set the rotation to the target rotation without spinning
    this.rotationDegrees = targetRotation;

    const spinRef = this.firestore.collection('spins').doc('currentSpin');
    spinRef.set({
      rotationDegrees: this.rotationDegrees,
      asker: '',
      responder: this.names[randomIndexResponder],  // Set the selected responder
      question: ''
    }).then(() => {
      // Select the responder after setting rotation
      this.selectedResponder = this.names[randomIndexResponder];

      // Randomly select the asker (shouldn't be the same as the responder)
      do {
        randomIndexAsker = Math.floor(Math.random() * this.names.length);
      } while (randomIndexAsker === randomIndexResponder);

      this.selectedAsker = this.names[randomIndexAsker];
      this.previousResponder = randomIndexResponder;
      this.recentResponders.push(randomIndexResponder);
      if (this.recentResponders.length > 3) this.recentResponders.shift();

      // Now select the question to ask
      const availableQuestions = this.questions.filter(q => !this.usedQuestions[q]);
      if (availableQuestions.length === 0) {
        console.log("No available questions left.");
        return;
      }

      this.selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      console.log(`Selected question: ${this.selectedQuestion}`);

      // Remove the selected question from available questions in Firestore
      const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
      questionsRef.update({
        questions: firebase.firestore.FieldValue.arrayRemove(this.selectedQuestion)
      });

      // Update Firestore with the final spin details
      spinRef.update({
        asker: this.selectedAsker,
        question: this.selectedQuestion
      }).finally(() => {
        this.spinning = false;  // Reset the spinning flag
      });
    });
  }







  getDegreePosition(index: number, name: string) {
    const totalNames = this.names.length;

    // Calculate the angle for each name, starting from the top (0 degrees), rotating clockwise
    const anglePerName = 360 / totalNames;

    // Calculate the degree for this particular name, adjusting to make 0 degrees point to the top
    const degree = (anglePerName * index) % 360;

    console.log(`Placing name: ${name} at degree: ${degree}`);

    const radius = 300;  // Radius from the center of the spinner to the name
    const center = 250;  // The center of the circle
    const textWidth = this.getTextWidth(name, '18px Arial');

    const adjustedRadius = radius + (textWidth > 100 ? (textWidth - 100) / 2 : 0);

    // Convert degrees to radians for positioning in a circle
    const radian = (degree * Math.PI) / 180;

    // Calculate the x and y position using polar coordinates
    const x = Math.cos(radian) * adjustedRadius + center;
    const y = Math.sin(radian) * adjustedRadius + center;

    // Return the CSS positions for this name
    return {
      left: `${x}px`,
      top: `${y}px`,
    };
  }












  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  getTextWidth(text: string, font: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      return context.measureText(text).width;
    }
    return 0;
  }

  markAllAsReadExceptOne() {
    if (this.questions.length <= 1) return;

    const randomIndex = Math.floor(Math.random() * this.questions.length);
    const questionToRemainUnread = this.questions[randomIndex];
    const updatedUsedQuestions: { [key: string]: boolean } = {};

    this.questions.forEach(question => {
      updatedUsedQuestions[question] = (question !== questionToRemainUnread);
    });

    this.usedQuestions = updatedUsedQuestions;

    this.firestore.collection('questions').doc('usedQuestions').set(updatedUsedQuestions);
  }

  markAllAsUnread() {
    const updatedUsedQuestions: { [key: string]: boolean } = {};
    this.questions.forEach(question => {
      updatedUsedQuestions[question] = false;
    });

    this.usedQuestions = updatedUsedQuestions;
    this.firestore.collection('questions').doc('usedQuestions').set(updatedUsedQuestions);
  }
}
