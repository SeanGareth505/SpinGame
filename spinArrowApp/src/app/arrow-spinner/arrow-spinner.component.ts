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
        // If the rotationDegrees don't match, update the rotation immediately without animation
        if (spin.rotationDegrees !== this.rotationDegrees) {
          // Instantly apply the final rotation for observing users (no animation)
          this.rotationDegrees = spin.rotationDegrees;
        }

        // Synchronize the asker, responder, and question across all users
        this.selectedAsker = spin.asker;
        this.selectedResponder = spin.responder;
        this.selectedQuestion = spin.question;
      }
    });

    // Listen for updates to the 'names' collection to sync the names list
    this.firestore.collection('names').doc('currentNames').valueChanges().subscribe((data: any) => {
      if (data && data.names) {
        this.names = data.names;  // Synchronize the names list across clients
      }
    });

    // Listen for updates to the 'questions' collection to sync the questions list
    this.firestore.collection('questions').doc('currentQuestions').valueChanges().subscribe((data: any) => {
      if (data && data.questions) {
        this.questions = data.questions;  // Synchronize the questions list across clients
      }
    });
  }

  addQuestion() {
    if (this.newQuestion.trim()) {
      this.questions.push(this.newQuestion); // Add to the local questions array

      // Optionally save to Firestore if you want persistence
      const questionsRef = this.firestore.collection('questions').doc('currentQuestions');
      questionsRef.set(
        { questions: firebase.firestore.FieldValue.arrayUnion(this.newQuestion) },
        { merge: true } // Only adds to the array, without overwriting
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
        { merge: true } // merge will ensure that it only adds to the existing array, not overwrite it
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
      names: firebase.firestore.FieldValue.arrayRemove(nameToDelete) // Remove the name from the array
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

    // Base radius for short names
    let radius = 300;
    const center = 250;

    // Dynamically calculate name width
    const textWidth = this.getTextWidth(name, '18px Arial'); // Calculate the width of the name in pixels

    // Adjust radius based on the name length
    if (textWidth > 100) { // Arbitrary threshold; adjust based on your needs
      radius += (textWidth - 100) / 2; // Move the name further out if it's longer
    }

    // Calculate position using the new radius
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
      context.font = font; // Set the desired font (same as in your CSS)
      return context.measureText(text).width; // Get the width of the text in pixels
    }
    return 0;
  }

  isLongName(name: string): boolean {
    return name.length > 10;
  }

  spin() {
    if (this.names.length > 1) {
      let randomIndexAsker: number;
      let randomIndexResponder: number;

      do {
        randomIndexAsker = Math.floor(Math.random() * this.names.length);
      } while (this.previousIndex === randomIndexAsker);

      this.previousIndex = randomIndexAsker;

      const degreesPerName = 360 / this.names.length;
      const targetRotation = degreesPerName * randomIndexAsker;

      // Set total rotation to be at least 3 full spins before landing on the target
      const totalRotationDegrees = (3 * 360) + targetRotation;

      // Set a consistent spin duration for all clients
      const spinDuration = 4000; // Spin for 4 seconds
      const startRotation = this.rotationDegrees;

      // Immediately broadcast the start of the spin to Firestore to synchronize across clients
      this.firestore.collection('spins').doc('currentSpin').set({
        rotationDegrees: startRotation + totalRotationDegrees,
        asker: '',  // Clear asker until spin is complete
        responder: '',  // Clear responder until spin is complete
        question: ''  // Clear question until spin is complete
      });

      const start = performance.now();

      const animateSpin = (currentTime: number) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / spinDuration, 1);

        const easedProgress = this.easeOutCubic(progress);

        this.rotationDegrees = startRotation + (totalRotationDegrees * easedProgress);

        if (progress < 1) {
          // Continue spinning
          requestAnimationFrame(animateSpin);
        } else {
          // After spin completes, select the asker, responder, and question
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

          // Update Firestore with the final spin data (asker, responder, question)
          this.firestore.collection('spins').doc('currentSpin').set({
            rotationDegrees: this.rotationDegrees,  // Keep final rotation for others
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

      // Start animation
      requestAnimationFrame(animateSpin);
    }
  }



  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

}
