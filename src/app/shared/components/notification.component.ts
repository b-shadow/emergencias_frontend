import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed top-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300"
      *ngIf="isVisible"
    >
      <div
        class="rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden border"
        [ngClass]="{
          'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700': type === 'success',
          'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700': type === 'error',
          'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700': type === 'info',
          'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700': type === 'warning'
        }"
      >
        <!-- Container con barra de color y contenido -->
        <div class="flex gap-4 p-4">
          <!-- Barra de color izquierda -->
          <div
            class="w-1 rounded-full flex-shrink-0"
            [ngClass]="{
              'bg-green-500': type === 'success',
              'bg-red-500': type === 'error',
              'bg-blue-500': type === 'info',
              'bg-yellow-500': type === 'warning'
            }"
          ></div>

          <!-- Contenido -->
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <h3
                  class="font-semibold text-sm mb-1"
                  [ngClass]="{
                    'text-green-900 dark:text-green-200': type === 'success',
                    'text-red-900 dark:text-red-200': type === 'error',
                    'text-blue-900 dark:text-blue-200': type === 'info',
                    'text-yellow-900 dark:text-yellow-200': type === 'warning'
                  }"
                >
                  <span class="mr-2">{{ iconEmoji }}</span>{{ title }}
                </h3>
                <p
                  class="text-xs leading-4"
                  [ngClass]="{
                    'text-green-800 dark:text-green-300': type === 'success',
                    'text-red-800 dark:text-red-300': type === 'error',
                    'text-blue-800 dark:text-blue-300': type === 'info',
                    'text-yellow-800 dark:text-yellow-300': type === 'warning'
                  }"
                >
                  {{ message }}
                </p>
              </div>

              <!-- Close Button -->
              <button
                (click)="onClose()"
                type="button"
                class="ml-4 text-xl opacity-60 hover:opacity-100 transition flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div
          class="h-1 w-full transition-all duration-100"
          [ngClass]="{
            'bg-green-200 dark:bg-green-700': type === 'success',
            'bg-red-200 dark:bg-red-700': type === 'error',
            'bg-blue-200 dark:bg-blue-700': type === 'info',
            'bg-yellow-200 dark:bg-yellow-700': type === 'warning'
          }"
          [style.width.%]="progressWidth"
        ></div>
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

    @keyframes slideInFromTop {
      from {
        transform: translateY(-1rem);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-in {
      animation: slideInFromTop 0.3s ease-out;
    }

    .fade-in {
      animation: fadeIn 0.3s ease-out;
    }
  `]
})
export class NotificationComponent {
  @Input() type: 'success' | 'error' | 'info' | 'warning' = 'info';
  @Input() title = 'Notificación';
  @Input() message = '';
  @Input() isVisible = false;
  @Input() duration = 4000;

  @Output() close = new EventEmitter<void>();

  progressWidth = 100;
  private closeTimer: any;
  private intervalTimer: any;

  ngOnChanges(): void {
    if (this.isVisible) {
      this.startAutoClose();
    }
  }

  private startAutoClose(): void {
    this.progressWidth = 100;

    // Interval para animar la barra de progreso
    this.intervalTimer = setInterval(() => {
      this.progressWidth -= (100 / (this.duration / 100));
      if (this.progressWidth <= 0) {
        this.progressWidth = 0;
        clearInterval(this.intervalTimer);
      }
    }, 100);

    // Timer para cerrar
    this.closeTimer = setTimeout(() => {
      this.onClose();
    }, this.duration);
  }

  onClose(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    if (this.intervalTimer) clearInterval(this.intervalTimer);
    this.close.emit();
  }

  get iconEmoji(): string {
    switch (this.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }
}
