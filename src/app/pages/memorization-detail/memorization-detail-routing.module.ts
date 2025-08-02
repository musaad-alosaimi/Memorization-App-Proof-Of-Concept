import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MemorizationDetailPage } from './memorization-detail.page';

const routes: Routes = [
  {
    path: '',
    component: MemorizationDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MemorizationDetailPageRoutingModule {} 