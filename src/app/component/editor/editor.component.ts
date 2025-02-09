import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, AfterViewInit,OnDestroy,} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GalleryService } from '../../service/gallery/gallery.service';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

// A simple interface representing a text zone overlay.
interface TextZone {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('imageCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('container', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  @ViewChild('beforeCanvas', { static: true })
  beforeCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('afterCanvas', { static: true })
  afterCanvasRef!: ElementRef<HTMLCanvasElement>;

  imageLoaded = false;
  image?: HTMLImageElement;
  textZones: TextZone[] = [];
  private nextZoneId = 0;

  // Variables for moving a text zone.
  private currentDragZone: TextZone | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  // Variables for resizing a text zone.
  private currentResizeZone: TextZone | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private initialZoneWidth = 0;
  private initialZoneHeight = 0;
  private initialFontSize = 0;

  // Bound event handlers so they can be added/removed.
  private onDragBound = this.onDrag.bind(this);
  private onDragStopBound = this.onDragStop.bind(this);
  private onResizeBound = this.onResize.bind(this);
  private onResizeStopBound = this.onResizeStop.bind(this);

  constructor(
    private http: HttpClient,
    private galleryService: GalleryService,
    private cookieService: CookieService,
    private router: Router) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDragBound);
    document.removeEventListener('mouseup', this.onDragStopBound);
    document.removeEventListener('mousemove', this.onResizeBound);
    document.removeEventListener('mouseup', this.onResizeStopBound);
  }

  // Loads the image from the selected file.
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const img = new Image();
          img.onload = () => {
            this.image = img;
            this.imageLoaded = true;
            this.drawMainCanvas();
            this.updatePreview();
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Draws the loaded image on the main canvas.
  drawMainCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx && this.image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    }
  }

  // Adds a new text zone. (Text starts empty so that the CSS placeholder shows.)
  addTextZone(): void {
    const newZone: TextZone = {
      id: this.nextZoneId++,
      x: 50,
      y: 50,
      width: 150,
      height: 50,
      text: '',
      fontSize: 20
    };
    this.textZones.push(newZone);
    this.updatePreview();
  }

  // Update the zone's text when the user types.
  updateZoneText(event: Event, zone: TextZone): void {
    const target = event.target as HTMLElement;
    zone.text = target.innerText;
    this.updatePreview();
  }

  // Optional: When the text zone receives focus, you might clear the default text.
  onTextFocus(event: Event, zone: TextZone): void {
    const target = event.target as HTMLElement;
    // If needed, you could clear the text if it equals a default value.
    // For now, we leave it as-is so that the user can position the caret.
  }

  // When the text zone loses focus, update the model.
  onTextBlur(event: Event, zone: TextZone): void {
    const target = event.target as HTMLElement;
    zone.text = target.innerText;
    this.updatePreview();
  }

  // ******* DRAGGING (Moving) A TEXT ZONE *******
  startDrag(event: MouseEvent, zone: TextZone): void {
    event.preventDefault();
    event.stopPropagation();
    this.currentDragZone = zone;
    const containerRect = this.containerRef.nativeElement.getBoundingClientRect();
    this.dragOffsetX = event.clientX - containerRect.left - zone.x;
    this.dragOffsetY = event.clientY - containerRect.top - zone.y;
    document.addEventListener('mousemove', this.onDragBound);
    document.addEventListener('mouseup', this.onDragStopBound);
  }

  onDrag(event: MouseEvent): void {
    if (this.currentDragZone) {
      const containerRect = this.containerRef.nativeElement.getBoundingClientRect();
      let newX = event.clientX - containerRect.left - this.dragOffsetX;
      let newY = event.clientY - containerRect.top - this.dragOffsetY;
      // Constrain the zone within the canvas.
      newX = Math.max(0, Math.min(newX, this.canvasRef.nativeElement.width - this.currentDragZone.width));
      newY = Math.max(0, Math.min(newY, this.canvasRef.nativeElement.height - this.currentDragZone.height));
      this.currentDragZone.x = newX;
      this.currentDragZone.y = newY;
      this.updatePreview();
    }
  }

  onDragStop(): void {
    this.currentDragZone = null;
    document.removeEventListener('mousemove', this.onDragBound);
    document.removeEventListener('mouseup', this.onDragStopBound);
  }

  // ******* RESIZING A TEXT ZONE *******
  startResize(event: MouseEvent, zone: TextZone): void {
    event.preventDefault();
    event.stopPropagation();
    this.currentResizeZone = zone;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.initialZoneWidth = zone.width;
    this.initialZoneHeight = zone.height;
    this.initialFontSize = zone.fontSize;
    document.addEventListener('mousemove', this.onResizeBound);
    document.addEventListener('mouseup', this.onResizeStopBound);
  }

  onResize(event: MouseEvent): void {
    if (this.currentResizeZone) {
      const deltaX = event.clientX - this.resizeStartX;
      const deltaY = event.clientY - this.resizeStartY;
      // Set minimum limits for width and height.
      const newWidth = Math.max(50, this.initialZoneWidth + deltaX);
      const newHeight = Math.max(20, this.initialZoneHeight + deltaY);
      this.currentResizeZone.width = newWidth;
      this.currentResizeZone.height = newHeight;
      // Optionally adjust the font size based on the new height.
      this.currentResizeZone.fontSize = Math.max(12, Math.floor(newHeight * 0.5));
      this.updatePreview();
    }
  }

  onResizeStop(): void {
    this.currentResizeZone = null;
    document.removeEventListener('mousemove', this.onResizeBound);
    document.removeEventListener('mouseup', this.onResizeStopBound);
  }

  // ******* REAL‑TIME PREVIEW UPDATE *******
  updatePreview(): void {
    if (!this.image) { return; }

    // Update the "Before" preview (original image)
    const beforeCanvas = this.beforeCanvasRef.nativeElement;
    const beforeCtx = beforeCanvas.getContext('2d');
    if (beforeCtx) {
      beforeCtx.clearRect(0, 0, beforeCanvas.width, beforeCanvas.height);
      beforeCtx.drawImage(this.image, 0, 0, beforeCanvas.width, beforeCanvas.height);
    }

    // Update the "After" preview (composite image)
    const afterCanvas = this.afterCanvasRef.nativeElement;
    const afterCtx = afterCanvas.getContext('2d');
    if (afterCtx) {
      afterCtx.clearRect(0, 0, afterCanvas.width, afterCanvas.height);
      // Determine scale factors (main canvas is 600×400; preview is 300×200)
      const scaleX = afterCanvas.width / this.canvasRef.nativeElement.width;
      const scaleY = afterCanvas.height / this.canvasRef.nativeElement.height;
      // Draw the base image.
      afterCtx.drawImage(this.image, 0, 0, afterCanvas.width, afterCanvas.height);
      // Draw each text zone.
      for (const zone of this.textZones) {
        afterCtx.font = zone.fontSize * scaleY + 'px Arial';
        afterCtx.fillStyle = 'black';
        const lines = zone.text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          afterCtx.fillText(
            lines[i],
            zone.x * scaleX,
            (zone.y + zone.fontSize * i) * scaleY + zone.fontSize * scaleY
          );
        }
      }
    }
  }

  // ******* SAVE THE COMPOSITE IMAGE *******
  saveImage(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx && this.image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw the base image on the main canvas.
      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
      // Overlay each text zone.
      for (const zone of this.textZones) {
        ctx.font = zone.fontSize + 'px Arial';
        ctx.fillStyle = 'black';
        const lines = zone.text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], zone.x, zone.y + zone.fontSize * (i + 1));
        }
      }
      this.imageLoaded = false;
      // Convert the canvas to a Blob (PNG) and send via HTTP POST.
      canvas.toBlob((blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob);
          
          this.galleryService.uploadFile(this.cookieService.get("auth_token"),formData).subscribe(
            (response) => this.router.navigate(['/gallery']),
            (error) => alert('Error saving image')
          );
        }
      });
    }
  }
}