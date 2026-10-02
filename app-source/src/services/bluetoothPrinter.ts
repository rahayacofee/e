/**
 * RAHAYA COFFEE POS - Bluetooth Thermal Printer ESC/POS Service
 * Supports 58mm (32 chars) and 80mm (48 chars) ESC/POS Bluetooth printers
 * Implements Web Bluetooth API for Android, Chrome, and desktop devices.
 */

export type PaperWidth = '58mm' | '80mm';

export interface PrinterDevice {
  id: string;
  name: string;
  connected: boolean;
}

export interface ReceiptPrintPayload {
  business: {
    name: string;
    address: string;
    phone?: string;
    header?: string;
    footer?: string;
  };
  transaction: {
    invoice_number: string;
    date: string;
    cashier: string;
    customer: string;
    order_type: string;
    table_number?: string | null;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      notes?: string;
    }>;
    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    service_amount?: number;
    total_amount: number;
    payment_method: string;
    amount_paid: number;
    change_amount: number;
  };
}

class BluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;
  private paperWidth: PaperWidth = '58mm';
  private isConnecting = false;

  // Well-known thermal printer Bluetooth BLE service and characteristic UUIDs
  private readonly PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '0000ae00-0000-1000-8000-00805f9b34fb',
  ];

  constructor() {
    const savedWidth = localStorage.getItem('rahaya_printer_width');
    if (savedWidth === '58mm' || savedWidth === '80mm') {
      this.paperWidth = savedWidth;
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getPaperWidth(): PaperWidth {
    return this.paperWidth;
  }

  public setPaperWidth(width: PaperWidth) {
    this.paperWidth = width;
    localStorage.setItem('rahaya_printer_width', width);
  }

  public isConnected(): boolean {
    return !!(this.device && this.device.gatt && this.device.gatt.connected && this.characteristic);
  }

  public getConnectedDevice(): PrinterDevice | null {
    if (!this.isConnected()) return null;
    return {
      id: this.device.id,
      name: this.device.name || 'Thermal Bluetooth Printer',
      connected: true,
    };
  }

  public isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  /**
   * Request user to pick a Bluetooth thermal printer device and connect
   */
  public async connect(): Promise<PrinterDevice> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth API tidak didukung di browser ini. Gunakan Google Chrome pada Android / PC atau gunakan cetak thermal browser.'
      );
    }
    if (this.isConnecting) {
      throw new Error('Proses koneksi sedang berjalan. Harap tunggu...');
    }

    this.isConnecting = true;
    try {
      // Prompt Android Bluetooth picker
      const navBluetooth = (navigator as any).bluetooth;
      if (!navBluetooth || !navBluetooth.requestDevice) {
        throw new Error('Web Bluetooth API tidak tersedia pada browser ini.');
      }

      let device: any;
      try {
        device = await navBluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: this.PRINTER_SERVICES,
        });
      } catch (reqErr: any) {
        if (
          reqErr.name === 'SecurityError' ||
          reqErr.message?.toLowerCase().includes('permissions policy') ||
          reqErr.message?.toLowerCase().includes('disallowed')
        ) {
          const err: any = new Error(
            'Browser Chrome memblokir Bluetooth karena aplikasi berjalan di dalam frame preview AI Studio. Buka URL langsung aplikasi di Tab Baru (Top-Level) agar Android dapat mengakses printer Bluetooth.'
          );
          err.isIframeBlocked = true;
          throw err;
        }
        if (reqErr.name === 'NotFoundError' || reqErr.message?.toLowerCase().includes('user cancelled') || reqErr.message?.toLowerCase().includes('cancelled')) {
          throw new Error('Pemindaian Bluetooth dibatalkan.');
        }
        throw reqErr;
      }

      if (!device) {
        throw new Error('Tidak ada printer Bluetooth yang dipilih.');
      }

      device.addEventListener('gattserverdisconnected', () => {
        console.warn('[Printer] Bluetooth printer disconnected.');
        this.characteristic = null;
      });

      const server = await device.gatt.connect();

      let targetCharacteristic: any = null;

      // Scan known services
      for (const serviceUuid of this.PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetCharacteristic = char;
              break;
            }
          }
          if (targetCharacteristic) break;
        } catch (e) {
          // Continue scanning next service UUID
        }
      }

      // If not found in known services, search any primary service
      if (!targetCharacteristic) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            try {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.write || char.properties.writeWithoutResponse) {
                  targetCharacteristic = char;
                  break;
                }
              }
              if (targetCharacteristic) break;
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (!targetCharacteristic) {
        throw new Error('Gagal menemukan karakteristik write printer pada perangkat Bluetooth yang dipilih.');
      }

      this.device = device;
      this.characteristic = targetCharacteristic;
      localStorage.setItem('rahaya_last_printer_name', device.name || 'Bluetooth Printer');

      return {
        id: device.id,
        name: device.name || 'Thermal Bluetooth Printer',
        connected: true,
      };
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Send binary data in small chunks (64 bytes) to avoid BLE MTU buffer overrun
   */
  private async writeRawBytes(bytes: Uint8Array): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const CHUNK_SIZE = 64;
    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
      const chunk = bytes.slice(offset, offset + CHUNK_SIZE);
      if (this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Small pause for printer hardware buffer
      await new Promise((resolve) => setTimeout(resolve, 15));
    }
  }

  /**
   * Helper to format two columns: left-aligned label and right-aligned value
   */
  private formatTwoCols(left: string, right: string, maxLen: number): string {
    const totalLen = left.length + right.length;
    if (totalLen <= maxLen) {
      const spaces = ' '.repeat(maxLen - totalLen);
      return left + spaces + right;
    }
    const truncatedLeft = left.slice(0, Math.max(0, maxLen - right.length - 1)) + ' ';
    const spaces = ' '.repeat(Math.max(0, maxLen - (truncatedLeft.length + right.length)));
    return truncatedLeft + spaces + right;
  }

  /**
   * Build ESC/POS bytecode for sample test receipt
   */
  public async testPrint(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const width = this.paperWidth === '58mm' ? 32 : 48;
    const divider = '-'.repeat(width);

    let text = '\x1B\x40'; // Initialize
    text += '\x1B\x61\x01'; // Center
    text += '\x1D\x21\x11'; // Double size
    text += 'RAHAYA COFFEE\n';
    text += '\x1D\x21\x00'; // Normal size
    text += 'TEST PRINT BLUETOOTH\n';
    text += `Lebar Kertas: ${this.paperWidth} (${width} Kolom)\n`;
    text += divider + '\n';
    text += '\x1B\x61\x00'; // Left align
    text += this.formatTwoCols('Status Koneksi', 'TERHUBUNG OK', width) + '\n';
    text += this.formatTwoCols('Waktu Uji', new Date().toLocaleTimeString('id-ID'), width) + '\n';
    text += this.formatTwoCols('Baud / Protokol', 'ESC/POS 9600/BLE', width) + '\n';
    text += divider + '\n';
    text += '\x1B\x61\x01'; // Center
    text += 'Printer Siap Digunakan!\n';
    text += '=== RAHAYA COFFEE POS ===\n\n\n\n';
    text += '\x1D\x56\x41\x03'; // Cut paper

    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    await this.writeRawBytes(bytes);
  }

  /**
   * Build and send authentic receipt to ESC/POS thermal Bluetooth printer
   */
  public async printReceipt(payload: ReceiptPrintPayload): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    const width = this.paperWidth === '58mm' ? 32 : 48;
    const divider = '-'.repeat(width);
    const { business, transaction } = payload;

    let text = '\x1B\x40'; // ESC @: Initialize printer
    text += '\x1B\x61\x01'; // Center alignment
    text += '\x1D\x21\x11'; // Double height and double width
    text += (business.name || 'RAHAYA COFFEE').toUpperCase() + '\n';
    text += '\x1D\x21\x00'; // Normal text size

    if (business.address) {
      text += business.address + '\n';
    }
    if (business.phone) {
      text += 'Telp: ' + business.phone + '\n';
    }
    if (business.header) {
      text += business.header + '\n';
    }
    text += divider + '\n';

    // Metadata
    text += '\x1B\x61\x00'; // Left align
    text += this.formatTwoCols('No. Inv:', transaction.invoice_number, width) + '\n';
    text += this.formatTwoCols('Waktu:', new Date(transaction.date).toLocaleString('id-ID'), width) + '\n';
    text += this.formatTwoCols('Kasir:', transaction.cashier, width) + '\n';
    text += this.formatTwoCols('Pelanggan:', `${transaction.customer} (${transaction.order_type})`, width) + '\n';
    if (transaction.table_number) {
      text += this.formatTwoCols('Meja / Ref:', transaction.table_number, width) + '\n';
    }
    text += divider + '\n';

    // Items
    for (const item of transaction.items) {
      text += `${item.product_name}\n`;
      const qtyPrice = `${item.quantity} x Rp ${item.unit_price.toLocaleString('id-ID')}`;
      const subtotal = `Rp ${item.subtotal.toLocaleString('id-ID')}`;
      text += this.formatTwoCols('  ' + qtyPrice, subtotal, width) + '\n';
      if (item.notes) {
        text += `  *Catatan: ${item.notes}\n`;
      }
    }
    text += divider + '\n';

    // Totals
    text += this.formatTwoCols('Subtotal:', `Rp ${transaction.subtotal.toLocaleString('id-ID')}`, width) + '\n';
    if (transaction.discount_amount > 0) {
      text += this.formatTwoCols('Diskon:', `-Rp ${transaction.discount_amount.toLocaleString('id-ID')}`, width) + '\n';
    }
    if (transaction.tax_amount > 0) {
      text += this.formatTwoCols('Pajak PB1 (10%):', `Rp ${transaction.tax_amount.toLocaleString('id-ID')}`, width) + '\n';
    }
    if (transaction.service_amount && transaction.service_amount > 0) {
      text += this.formatTwoCols('Layanan:', `Rp ${transaction.service_amount.toLocaleString('id-ID')}`, width) + '\n';
    }

    // Grand total in bold
    text += '\x1B\x45\x01'; // Bold ON
    text += this.formatTwoCols('TOTAL:', `Rp ${transaction.total_amount.toLocaleString('id-ID')}`, width) + '\n';
    text += '\x1B\x45\x00'; // Bold OFF
    text += divider + '\n';

    // Payment details
    text += this.formatTwoCols('Metode:', transaction.payment_method, width) + '\n';
    text += this.formatTwoCols('Bayar:', `Rp ${transaction.amount_paid.toLocaleString('id-ID')}`, width) + '\n';
    if (transaction.change_amount > 0) {
      text += this.formatTwoCols('Kembali:', `Rp ${transaction.change_amount.toLocaleString('id-ID')}`, width) + '\n';
    }
    text += divider + '\n';

    // Footer
    text += '\x1B\x61\x01'; // Center align
    text += (business.footer || 'Terima kasih atas kunjungan Anda!') + '\n';
    text += 'POWERED BY RAHAYA COFFEE POS\n';
    text += '\n\n\n\n'; // Feed paper
    text += '\x1D\x56\x41\x03'; // GS V: Partial paper cut

    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    await this.writeRawBytes(bytes);
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
