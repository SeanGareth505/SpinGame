import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-view-question',
  templateUrl: './view-question.component.html',
  styleUrls: ['./view-question.component.scss']
})
export class ViewQuestionComponent implements OnInit {
  selectedAsker: string = '';
  selectedResponder: string = '';
  selectedQuestion: string = '';
  remainingQuestions: number = 0;
  newQuestion: string = '';

  questionHistory: { [name: string]: string[] } = {}; // Store question history
  questions: string[] = []; // Store all questions

  constructor(private firestore: AngularFirestore) { }

  ngOnInit() {
    // Subscribe to the current spin to get asker, responder, and question
    this.updateRemainingQuestions();

    // Subscribe to the question history
    this.firestore.collection('questionHistory').valueChanges().subscribe((history: any) => {
      console.log('history', history)
      if (history) {
        this.questionHistory = history;
        // this.updateRemainingQuestions();

        // Subscribe to the list of all questions
        this.firestore.collection('questions').doc('currentQuestions').valueChanges().subscribe((data: any) => {
          if (data && data.questions) {
            this.questions = data.questions;
            this.firestore.collection('spins').doc('currentSpin').valueChanges().subscribe((spin: any) => {
              if (spin) {
                this.selectedAsker = spin.asker;
                this.selectedResponder = spin.responder;
                this.selectedQuestion = spin.question;

                // Update remaining question count whenever a new spin occurs
                this.updateRemainingQuestions();
              }
            });
          }
        });
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

  // Update the count of remaining questions for the current responder
  updateRemainingQuestions() {
    console.log('this.selectedResponder', this.selectedResponder);
    console.log('this.questions.length', this.questions.length);

    if (this.selectedResponder && typeof this.selectedResponder === 'string' && this.selectedResponder.trim() !== '' && this.questions.length > 0) {
      // Sanitize selectedResponder to avoid key mismatches
      const sanitizedResponder = this.selectedResponder.trim().toLowerCase();
      console.log('sanitizedResponder', sanitizedResponder);

      // Initialize askedQuestions as an empty array
      let askedQuestions: string[] = [];

      // Loop through the array of objects in questionHistory
      if (Array.isArray(this.questionHistory)) {
        this.questionHistory.forEach(entry => {
          if (entry[sanitizedResponder]) {
            askedQuestions = entry[sanitizedResponder];
          }
        });
      }

      console.log('askedQuestions', askedQuestions);

      // Filter out questions that have already been asked to the responder
      const remaining = this.questions.filter(q => !askedQuestions.includes(q));

      console.log('remaining', remaining);

      this.remainingQuestions = remaining.length; // Set the count of remaining questions
    } else {
      this.remainingQuestions = 0; // Set to zero if no responder is selected or no questions are loaded
    }
  }



}
