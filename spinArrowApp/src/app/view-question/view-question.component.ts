import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-view-question',
  templateUrl: './view-question.component.html',
  styleUrls: ['./view-question.component.scss']
})
export class ViewQuestionComponent implements OnInit {
  selectedAsker: string = '';
  selectedResponder: string = '';
  selectedQuestion: string = '';

  constructor(private firestore: AngularFirestore) { }

  ngOnInit() {
    this.firestore.collection('spins').doc('currentSpin').valueChanges().subscribe((spin: any) => {
      if (spin) {
        this.selectedAsker = spin.asker;
        this.selectedResponder = spin.responder;
        this.selectedQuestion = spin.question;
        console.log(`Asker: ${this.selectedAsker}, Responder: ${this.selectedResponder}, Question: ${this.selectedQuestion}`);
      }
    });
  }
}
