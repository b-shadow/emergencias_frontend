import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center" *ngIf="isOpen">
      <!-- Overlay oscuro -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        (click)="onCancel()"
      ></div>

      <!-- Modal centrado -->
      <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 px-6 py-4">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="text-2xl">⚠️</span>
            {{ title }}
          </h2>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <p class="text-gray-700 dark:text-slate-300 text-center">
            {{ message }}
          </p>
        </div>

        <!-- Buttons -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700 flex gap-3 justify-center">
          <button
            (click)="onCancel()"
            type="button"
            class="px-6 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-500 transition-all duration-200 active:scale-95"
          >
            {{ cancelText }}
          </button>
          <button
            (click)="onConfirm()"
            type="button"
            [class]="'px-6 py-2 rounded-lg font-semibold text-white transition-all duration-200 active:scale-95 ' + (isDanger ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30' : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-lg shadow-blue-500/30')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes zoomIn95 {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    :host {
      --animate-in: fadeIn 0.2s ease-out;
    }

    .animate-in {
      animation: fadeIn 0.2s ease-out, zoomIn95 0.2s ease-out;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar';
  @Input() message = '¿Estás seguro?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() isDanger = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
