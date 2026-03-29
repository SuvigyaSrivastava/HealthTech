import type { Patient } from '../../shared/types/patient.types';
import type { RiskAlert } from '../../shared/types/secondBrain.types';

class NotificationService {
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return Notification.requestPermission();
  }

  async showNotification(
    title: string,
    body: string,
    options: { tag?: string; requireInteraction?: boolean; data?: unknown; actions?: Array<{ action: string; title: string }> } = {}
  ): Promise<void> {
    if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') {
      // Fallback to basic notification
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        data: options.data,
      });
    } catch {
      // ignore if not supported
    }
  }

  async showCriticalAlert(patient: Patient, alert: RiskAlert): Promise<void> {
    await this.showNotification(
      '🚨 Critical Patient Alert',
      `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}: ${alert.description}`,
      {
        tag: `critical-${patient.id}-${alert.id}`,
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Patient' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        data: { url: `/patients/${patient.id}?tab=second-brain` },
      }
    );
  }

  async showLabResultReady(patientName: string, testName: string): Promise<void> {
    await this.showNotification(
      '🔬 Lab Result Ready',
      `New ${testName} result available for ${patientName}`,
      { tag: `lab-${Date.now()}` }
    );
  }

  async showAppointmentReminder(patientName: string, time: string): Promise<void> {
    await this.showNotification(
      '📅 Appointment Reminder',
      `${patientName} — ${time}`,
      { tag: `apt-${Date.now()}`, requireInteraction: false }
    );
  }

  async showSystemUpdate(message: string): Promise<void> {
    await this.showNotification('📢 System Update', message, { tag: 'system-update' });
  }
}

export const notificationService = new NotificationService();

// Register service worker
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[SW] Registered:', reg.scope))
        .catch((err) => console.warn('[SW] Registration failed:', err));
    });
  }
}
