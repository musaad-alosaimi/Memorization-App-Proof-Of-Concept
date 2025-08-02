import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MemorizationService } from '../services/memorization.service';
import { MemorizationItem } from '../models/memorization-item.model';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule]
})
export class Tab1Page {
  items: MemorizationItem[] = [];

  constructor(
    private memorizationService: MemorizationService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.memorizationService.getItems().subscribe(items => {
      this.items = items;
    });
  }

  async addNewItem() {
    const alert = await this.alertController.create({
      header: 'Add New Item',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Title'
        },
        {
          name: 'content',
          type: 'textarea',
          placeholder: 'Content to memorize'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Add',
          handler: (data) => {
            if (data.title && data.content) {
              this.memorizationService.addItem({
                title: data.title,
                content: data.content
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async deleteItem(id: string) {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this item?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.memorizationService.deleteItem(id);
          }
        }
      ]
    });

    await alert.present();
  }
}
