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
  newQuestion: string = ''; // Bind to input field
  questionHistory: { [key: string]: string[] } = {}; // Updated to track questions per responder
  isHistoryLoaded: boolean = false; // Flag to ensure questionHistory is loaded

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
    // Listen for updates to the 'currentSpin' document for real-time spin synchronization
    this.firestore.collection('spins').doc('currentSpin').valueChanges().subscribe((spin: any) => {
      if (spin) {
        if (spin.rotationDegrees !== this.rotationDegrees) {
          this.rotationDegrees = spin.rotationDegrees;
        }

        this.selectedAsker = spin.asker;
        this.selectedResponder = spin.responder;
        this.selectedQuestion = spin.question;
      }
    });

    // Listen for updates to the 'names' collection to sync the names list
    this.firestore.collection('names').doc('currentNames').valueChanges().subscribe((data: any) => {
      if (data && data.names) {
        this.names = data.names;
      }
    });

    // Listen for updates to the 'questions' collection to sync the questions list
    this.firestore.collection('questions').doc('currentQuestions').valueChanges().subscribe((data: any) => {
      if (data && data.questions) {
        this.questions = data.questions;
      }
    });

    // Retrieve the question history from Firestore
    this.firestore.collection('questionHistory').doc('history').valueChanges().subscribe((data: any) => {
      console.log('data', data)
      this.isHistoryLoaded = true; // Flag that questionHistory is now loaded
      if (data && data.history) {
        this.questionHistory = data.history; // Synchronize the question history across clients
        console.log('this.isHistoryLoaded2222222', this.isHistoryLoaded)
        console.log('questionHistory loaded:', this.questionHistory);
      }
    });
  }

  addQuestion() {
    if (this.newQuestion.trim()) {
      this.questions.push(this.newQuestion);

      // Optionally save to Firestore if you want persistence
      const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
      questionsRef.set(
        { questions: firebase.firestore.FieldValue.arrayUnion(this.newQuestion) },
        { merge: true }
      )
        .then(() => {
          console.log('Question added to Firestore');
        })
        .catch((error) => {
          console.error('Error adding question: ', error);
        });

      this.newQuestion = ''; // Clear the input field
    }
  }

  addName() {
    if (this.newName) {
      const namesRef = this.firestore.collection('names').doc('currentNames');

      namesRef.set(
        { names: firebase.firestore.FieldValue.arrayUnion(this.newName) },
        { merge: true }
      )
        .then(() => {
          console.log('Name added to Firestore');
        })
        .catch((error) => {
          console.error('Error adding name: ', error);
        });

      this.newName = ''; // Clear the input field
    }
  }

  deleteName(index: number) {
    const nameToDelete = this.names[index];

    // Remove the name from the Firestore 'names' collection
    const namesRef = this.firestore.collection('names').doc('currentNames');
    namesRef.update({
      names: firebase.firestore.FieldValue.arrayRemove(nameToDelete)
    })
      .then(() => {
        console.log('Name deleted from Firestore');
      })
      .catch((error) => {
        console.error('Error deleting name: ', error);
      });
  }

  getDegreePosition(index: number, name: string) {
    const totalNames = this.names.length;
    const anglePerName = 360 / totalNames;
    const degree = anglePerName * index;

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

  isLongName(name: string): boolean {
    return name.length > 10;
  }

  spin() {
    if (!this.isHistoryLoaded) {
      console.error('Question history has not been loaded yet.');
      return;
    }

    console.log('this.names', this.names);

    if (!this.names || this.names.length <= 1) {
      console.error('Names array is either undefined or has insufficient members.');
      return;
    }

    let randomIndexAsker: number;
    let randomIndexResponder: number;

    do {
      randomIndexAsker = Math.floor(Math.random() * this.names.length);
    } while (this.previousIndex === randomIndexAsker);

    if (isNaN(randomIndexAsker)) {
      console.error('randomIndexAsker generated NaN');
      return;
    }

    this.previousIndex = randomIndexAsker;

    const degreesPerName = 360 / this.names.length;
    if (isNaN(degreesPerName)) {
      console.error('degreesPerName is NaN');
      return;
    }

    const targetRotation = degreesPerName * randomIndexAsker;
    if (isNaN(targetRotation)) {
      console.error('targetRotation is NaN');
      return;
    }

    const totalRotationDegrees = (3 * 360) + targetRotation;

    this.rotationDegrees = this.rotationDegrees || 0;
    const startRotation = isNaN(this.rotationDegrees) ? 0 : this.rotationDegrees;

    const finalRotationDegrees = startRotation + totalRotationDegrees;
    if (isNaN(finalRotationDegrees)) {
      console.error('Final rotationDegrees is NaN');
      return;
    }

    const spinDuration = 4000;
    const start = performance.now();

    this.firestore.collection('spins').doc('currentSpin').set({
      rotationDegrees: finalRotationDegrees,
      asker: '',
      responder: '',
      question: ''
    });

    const animateSpin = (currentTime: number) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easedProgress = this.easeOutCubic(progress);

      this.rotationDegrees = startRotation + (totalRotationDegrees * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.selectedAsker = this.names[randomIndexAsker];

        do {
          randomIndexResponder = Math.floor(Math.random() * this.names.length);
        } while (
          randomIndexResponder === randomIndexAsker ||
          randomIndexResponder === this.previousResponder
        );

        this.selectedResponder = this.names[randomIndexResponder];
        this.previousResponder = randomIndexResponder;

        this.selectedQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];

        // Update the question history for the selected responder
        if (!this.questionHistory[this.selectedResponder]) {
          this.questionHistory[this.selectedResponder] = []; // Initialize if not present
        }
        this.questionHistory[this.selectedResponder].push(this.selectedQuestion); // Add the selected question

        // Optionally save the question history to Firestore
        this.firestore.collection('questionHistory').doc('history').set(
          { [this.selectedResponder]: firebase.firestore.FieldValue.arrayUnion(this.selectedQuestion) },
          { merge: true }
        )
          .then(() => {
            console.log('Question history updated in Firestore');
          })
          .catch((error) => {
            console.error('Error updating question history: ', error);
          });

        // Final update to Firestore
        this.firestore.collection('spins').doc('currentSpin').set({
          rotationDegrees: this.rotationDegrees,
          asker: this.selectedAsker,
          responder: this.selectedResponder,
          question: this.selectedQuestion
        })
          .then(() => {
            console.log('Final spin data updated in Firestore for synchronization.');
          })
          .catch((error) => {
            console.error('Error updating final spin data: ', error);
          });
      }
    };

    requestAnimationFrame(animateSpin);
  }

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
