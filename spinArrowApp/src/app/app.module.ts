import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArrowSpinnerComponent } from './arrow-spinner/arrow-spinner.component';
import { FormsModule } from '@angular/forms';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB9ReI8QdMrvsi0gIXlT2CkfFaKWR8ukOE",
  authDomain: "spinbottleapp.firebaseapp.com",
  projectId: "spinbottleapp",
  storageBucket: "spinbottleapp.appspot.com",
  messagingSenderId: "285539728216",
  appId: "1:285539728216:web:a069b60b7bb7960410c32d"
};


@NgModule({
  declarations: [
    AppComponent,
    ArrowSpinnerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule // Firestore module
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
