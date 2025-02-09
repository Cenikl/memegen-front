import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild,OnDestroy, OnInit,} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GalleryService, ImageDto } from '../../service/gallery/gallery.service';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';

interface TextZone {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements OnInit, OnDestroy {
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
  filename: string = "default";
  private nextZoneId = 0;
  currentFocusedZoneId: number | null = null;
  isLoading = false;
  private currentDragZone: TextZone | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private currentResizeZone: TextZone | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private initialZoneWidth = 0;
  private initialZoneHeight = 0;
  private initialFontSize = 0;
  private onDragBound = this.onDrag.bind(this);
  private onDragStopBound = this.onDragStop.bind(this);
  private onResizeBound = this.onResize.bind(this);
  private onResizeStopBound = this.onResizeStop.bind(this);

  constructor(
    private http: HttpClient,
    private galleryService: GalleryService,
    private cookieService: CookieService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const state = history.state;
    if (state && state.image) {
      const imageDto: ImageDto = state.image;
      this.filename = imageDto.name;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.image = img;
        this.imageLoaded = true;
        this.drawMainCanvas();
        this.updatePreview();
      };
      img.src = imageDto.url;
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDragBound);
    document.removeEventListener('mouseup', this.onDragStopBound);
    document.removeEventListener('mousemove', this.onResizeBound);
    document.removeEventListener('mouseup', this.onResizeStopBound);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.filename = file.name;
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

  drawMainCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx && this.image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
    }
  }

  addTextZone(): void {
    const newZone: TextZone = {
      id: this.nextZoneId++,
      x: 50,
      y: 50,
      width: 150,
      height: 50,
      text: '',
      fontSize: 15,
      color: '#000000',
      fontFamily: 'Arial'
    };
    this.textZones.push(newZone);
    this.updatePreview();
  }

  closeTextZone(zoneId: number) {
    this.textZones = this.textZones.filter(zone => zone.id !== zoneId);
    this.updatePreview();
  }

  updateZoneText(event: Event, zone: TextZone): void {
    const target = event.target as HTMLElement;
    zone.text = target.innerText;
    this.updatePreview();
  }

  toggleCustomizeControls(event: Event, zone: TextZone): void {
    event.stopPropagation();
    this.currentFocusedZoneId = this.currentFocusedZoneId === zone.id ? null : zone.id;
    this.updatePreview();
  }
  
  hideCustomizeControls(): void {
    this.currentFocusedZoneId = null;
    this.updatePreview();
  }

  onTextFocus(event: Event, zone: TextZone): void {
  }

  goToGallery(): void {
    this.router.navigate(['/gallery']);
  }

  onTextBlur(event: Event, zone: TextZone): void {
    const target = event.target as HTMLElement;
    zone.text = target.innerText;
    this.updatePreview();
  }

  changeFontSize(zone:TextZone, holder: number): void {
    zone.fontSize= zone.fontSize + holder;
    this.updatePreview();
  }

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
      const newWidth = Math.max(50, this.initialZoneWidth + deltaX);
      const newHeight = Math.max(20, this.initialZoneHeight + deltaY);
      this.currentResizeZone.width = newWidth;
      this.currentResizeZone.height = newHeight;
      this.currentResizeZone.fontSize = Math.max(12, Math.floor(newHeight * 0.5));
      this.updatePreview();
    }
  }

  onResizeStop(): void {
    this.currentResizeZone = null;
    document.removeEventListener('mousemove', this.onResizeBound);
    document.removeEventListener('mouseup', this.onResizeStopBound);
  }

  updatePreview(): void {
    if (!this.image) { return; }
    const beforeCanvas = this.beforeCanvasRef.nativeElement;
    const beforeCtx = beforeCanvas.getContext('2d');
    if (beforeCtx) {
      beforeCtx.clearRect(0, 0, beforeCanvas.width, beforeCanvas.height);
      beforeCtx.drawImage(this.image, 0, 0, beforeCanvas.width, beforeCanvas.height);
    }
    const afterCanvas = this.afterCanvasRef.nativeElement;
    const afterCtx = afterCanvas.getContext('2d');
    if (afterCtx) {
      afterCtx.clearRect(0, 0, afterCanvas.width, afterCanvas.height);
      const scaleX = afterCanvas.width / this.canvasRef.nativeElement.width;
      const scaleY = afterCanvas.height / this.canvasRef.nativeElement.height;
      afterCtx.drawImage(this.image, 0, 0, afterCanvas.width, afterCanvas.height);
      for (const zone of this.textZones) {
        afterCtx.font = zone.fontSize * scaleY + 'px ' + zone.fontFamily;
        afterCtx.fillStyle = zone.color;
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

  saveImage(): void {
    this.isLoading = true;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx && this.image) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);
      for (const zone of this.textZones) {
        ctx.font = zone.fontSize + 'px ' + zone.fontFamily;
        ctx.fillStyle = zone.color;
        const lines = zone.text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], zone.x, zone.y + zone.fontSize * (i + 1));
        }
      }
      this.imageLoaded = false;

      canvas.toBlob((blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append('file', blob, this.filename);
          this.galleryService.uploadFile(this.cookieService.get("auth_token"), formData).subscribe(
            (response) => {
              this.isLoading = false;
              this.router.navigate(['/gallery'])},
            (error) => {
              this.isLoading = false;
              alert('Error saving image')}
          );
        }
      });
    }
  }
}