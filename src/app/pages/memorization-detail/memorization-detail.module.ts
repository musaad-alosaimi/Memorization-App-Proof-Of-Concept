import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MemorizationDetailPageRoutingModule } from './memorization-detail-routing.module';
import { MemorizationDetailPage } from './memorization-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MemorizationDetailPageRoutingModule
  ],
})
export class MemorizationDetailPageModule {} 