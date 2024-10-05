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
  recentAskers: number[] = [];
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
    console.log('Initializing the component and loading Firestore data...');

    this.firestore.collection('spins').doc('currentSpin').valueChanges().subscribe((spin: any) => {
      if (spin) {
        this.rotationDegrees = spin.rotationDegrees;
        this.selectedAsker = spin.asker;
        this.selectedResponder = spin.responder;
        this.selectedQuestion = spin.question;
        console.log('Loaded spin data from Firestore:', spin);
      }
    });

    this.firestore.collection('names').doc('currentNames').valueChanges().subscribe((data: any) => {
      if (data && data.names) {
        this.names = data.names;
        console.log('Loaded names from Firestore:', data.names);
      }
    });

    this.firestore.collection('questions').doc('currentQuestions').valueChanges().subscribe((data: any) => {
      if (data && data.questions) {
        this.questions = data.questions;
        console.log('Loaded questions from Firestore:', data.questions);
      }
    });

    this.firestore.collection('questionHistory').doc('history').valueChanges().subscribe((data: any) => {
      if (data && data.history) {
        this.questionHistory = data.history;
        this.isHistoryLoaded = true;
        console.log('Loaded question history from Firestore:', data.history);
      } else {
        this.isHistoryLoaded = true;
        console.log('No question history found.');
      }
    });

    this.firestore.collection('questions').doc('usedQuestions').get().subscribe((docSnapshot: any) => {
      if (docSnapshot.exists) {
        this.firestore.collection('questions').doc('usedQuestions').valueChanges().subscribe((data: any) => {
          if (data && data.usedQuestions) {
            this.usedQuestions = data.usedQuestions;
            console.log('Loaded used questions from Firestore:', data.usedQuestions);
          }
        });
      } else {
        console.log('No usedQuestions document found in Firestore, creating a new one...');
        this.firestore.collection('questions').doc('usedQuestions').set({
          usedQuestions: {}
        }).then(() => {
          console.log('Created usedQuestions document in Firestore.');
        }).catch((error) => {
          console.error('Error creating usedQuestions document:', error);
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
      ).then(() => {
        console.log('Added new question to Firestore:', this.newQuestion);
      }).catch((error) => {
        console.error('Error adding new question to Firestore:', error);
      });

      this.newQuestion = '';
    }
  }

  addName() {
    if (this.newName) {
      const namesRef = this.firestore.collection('names').doc('currentNames');
      namesRef.set(
        { names: firebase.firestore.FieldValue.arrayUnion(this.newName) },
        { merge: true }
      ).then(() => {
        console.log('Added new name to Firestore:', this.newName);
      }).catch((error) => {
        console.error('Error adding new name to Firestore:', error);
      });

      this.newName = '';
    }
  }

  deleteName(index: number) {
    const nameToDelete = this.names[index];
    const namesRef = this.firestore.collection('names').doc('currentNames');
    namesRef.update({
      names: firebase.firestore.FieldValue.arrayRemove(nameToDelete)
    }).then(() => {
      console.log('Deleted name from Firestore:', nameToDelete);
    }).catch((error) => {
      console.error('Error deleting name from Firestore:', error);
    });
  }

  get remainingQuestions(): number {
    const remaining = this.questions.filter(q => !this.usedQuestions[q]).length;
    console.log('Remaining questions count:', remaining);
    return remaining;
  }

  spin() {
    if (!this.isHistoryLoaded) return;

    if (!this.names || this.names.length <= 1) return;

    let randomIndexAsker: number;
    let randomIndexResponder: number;

    // Select random asker
    do {
      randomIndexAsker = Math.floor(Math.random() * this.names.length);
    } while (this.previousIndex === randomIndexAsker || this.recentAskers.includes(randomIndexAsker));

    this.previousIndex = randomIndexAsker;
    this.recentAskers.push(randomIndexAsker);
    if (this.recentAskers.length > 3) this.recentAskers.shift();

    console.log('Selected asker index:', randomIndexAsker);

    const degreesPerName = 360 / this.names.length;
    const targetRotation = degreesPerName * randomIndexAsker; // No offset, align with initial arrow position at 0 degrees
    console.log('Degrees per name:', degreesPerName);
    console.log('Target rotation (no offset):', targetRotation);

    const totalRotationDegrees = (3 * 360) + targetRotation; // Add extra spins for animation
    console.log('Total rotation degrees:', totalRotationDegrees);

    const startRotation = isNaN(this.rotationDegrees) ? 0 : this.rotationDegrees;
    const finalRotationDegrees = startRotation + totalRotationDegrees;
    console.log('Final rotation degrees:', finalRotationDegrees);

    const spinDuration = 4000;
    const start = performance.now();

    const spinRef = this.firestore.collection('spins').doc('currentSpin');
    spinRef.set({
      rotationDegrees: finalRotationDegrees,
      asker: '',
      responder: '',
      question: ''
    }).then(() => {
      console.log('Initial spin state saved to Firestore');
    }).catch((error) => {
      console.error('Error saving spin state to Firestore:', error);
    });

    const animateSpin = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easedProgress = this.easeOutCubic(progress);

      this.rotationDegrees = startRotation + (totalRotationDegrees * easedProgress);
      console.log('Current rotation degrees during spin:', this.rotationDegrees);

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.selectedAsker = this.names[randomIndexAsker];
        console.log('Selected asker:', this.selectedAsker);

        do {
          randomIndexResponder = Math.floor(Math.random() * this.names.length);
        } while (randomIndexResponder === randomIndexAsker || randomIndexResponder === this.previousResponder || this.recentResponders.includes(randomIndexResponder));

        this.selectedResponder = this.names[randomIndexResponder];
        this.previousResponder = randomIndexResponder;
        this.recentResponders.push(randomIndexResponder);
        if (this.recentResponders.length > 3) this.recentResponders.shift();

        console.log('Selected responder:', this.selectedResponder);

        const availableQuestions = this.questions;
        if (availableQuestions.length === 0) {
          console.log('No available questions left.');
          return;
        }

        this.selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        console.log('Selected question:', this.selectedQuestion);

        const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
        questionsRef.update({
          questions: firebase.firestore.FieldValue.arrayRemove(this.selectedQuestion)
        }).then(() => {
          console.log('Removed used question from Firestore:', this.selectedQuestion);
        }).catch((error) => {
          console.error('Error removing question from Firestore:', error);
        });

        spinRef.set({
          rotationDegrees: this.rotationDegrees,
          asker: this.selectedAsker,
          responder: this.selectedResponder,
          question: this.selectedQuestion
        }).then(() => {
          console.log('Final spin data updated in Firestore.');
        }).catch((error) => {
          console.error('Error updating final spin data in Firestore:', error);
        });
      }
    };

    requestAnimationFrame(animateSpin);
  }


  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  getDegreePosition(index: number, name: string) {
    const totalNames = this.names.length;
    const anglePerName = 360 / totalNames;
    const degree = anglePerName * index;
    console.log('Placing name:', name, 'at degree:', degree);

    let radius = 300;
    const center = 250;
    const textWidth = this.getTextWidth(name, '18px Arial');

    if (textWidth > 100) {
      radius += (textWidth - 100) / 2;
    }

    const radian = (degree * Math.PI) / 180;
    const x = Math.cos(radian) * radius + center;
    const y = Math.sin(radian) * radius + center;

    return {
      left: `${x}px`,
      top: `${y}px`,
    };
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
