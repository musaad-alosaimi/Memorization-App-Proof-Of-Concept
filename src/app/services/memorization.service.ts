import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MemorizationItem } from '../models/memorization-item.model';

@Injectable({
  providedIn: 'root'
})
export class MemorizationService {
  private items: MemorizationItem[] = [];
  private itemsSubject = new BehaviorSubject<MemorizationItem[]>([]);

  constructor() {
    // Load items from storage on init
    this.loadItems();
  }

  private loadItems() {
    const storedItems = localStorage.getItem('memorization-items');
    if (storedItems) {
      this.items = JSON.parse(storedItems);
      this.itemsSubject.next(this.items);
    }
  }

  private saveItems() {
    localStorage.setItem('memorization-items', JSON.stringify(this.items));
    this.itemsSubject.next(this.items);
  }

  getItems(): Observable<MemorizationItem[]> {
    return this.itemsSubject.asObservable();
  }

  getItem(id: string): MemorizationItem | undefined {
    return this.items.find(item => item.id === id);
  }

  addItem(item: Omit<MemorizationItem, 'id' | 'createdAt'>) {
    const newItem: MemorizationItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    this.items.push(newItem);
    this.saveItems();
  }

  updateItem(id: string, updates: Partial<MemorizationItem>) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates };
      this.saveItems();
    }
  }

  deleteItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveItems();
  }
} 