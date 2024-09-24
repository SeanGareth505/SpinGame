import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArrowSpinnerComponent } from './arrow-spinner/arrow-spinner.component';
import { ViewQuestionComponent } from './view-question/view-question.component';

const routes: Routes = [
  { path: '', redirectTo: '/spinner', pathMatch: 'full' },
  { path: 'spinner', component: ArrowSpinnerComponent },
  { path: 'question', component: ViewQuestionComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
