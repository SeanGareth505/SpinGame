import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArrowSpinnerComponent } from './arrow-spinner/arrow-spinner.component';
import { ViewQuestionComponent } from './view-question/view-question.component';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

const routes: Routes = [
  { path: '', redirectTo: '/spinner', pathMatch: 'full' },
  { path: 'spinner', component: ArrowSpinnerComponent },
  { path: 'question', component: ViewQuestionComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }]
})
export class AppRoutingModule { }
