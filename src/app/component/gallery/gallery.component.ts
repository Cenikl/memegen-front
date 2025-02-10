import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { GalleryService } from '../../service/gallery/gallery.service';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule,NgxPaginationModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  images: any[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  previewImage: any = null;
  showShareModal = false;
  selectedImageUrl: string = '';
  page: number = 1;
  isLoading1 = false;
  isLoading2 = false;


  constructor(
    private galleryService: GalleryService,
    private router: Router,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const token = this.cookieService.get('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.galleryService.getImages(token).subscribe({
      next: (data) => {
        this.images = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to fetch images:', err);
        this.errorMessage = 'Failed to load images';
        this.loading = false;
      }
    });
  }

  uploadImage(): void {
    this.router.navigate(['/editor']);
  }

  signOut(): void {
    this.cookieService.delete("auth_token");
    this.router.navigate(['/login']);
  }

  deleteImage(image: any, event: MouseEvent): void {
    this.isLoading1 = true;
    event.stopPropagation();
    this.galleryService.deleteFile(this.cookieService.get("auth_token"),image.url).subscribe({
      next: () => {
        this.isLoading1 = false;
        this.images = this.images.filter(img => img.url !== image.url);
      },
      error: (err) => {
        this.isLoading1 = false;
        console.error('Failed to delete image:', err);
      }
    });
  }

  updateImage(image: any, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/editor'], { state: { image } });
  }

  viewImage(image: any, event: MouseEvent): void {
    event.stopPropagation();
    this.previewImage = image;
  }

  closeViewModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.previewImage = null;
    }
  }

  downloadImage(image: any, event: MouseEvent): void {
    this.isLoading2 = true;
    event.stopPropagation();
    this.galleryService.downloadFile(this.cookieService.get('auth_token'),image.url).subscribe({
      next: (blob : Blob) => {
        let extension = '.png';
        if (image.name && image.name.toLowerCase().endsWith('.jpeg')) {
          extension = '.jpeg';
        } else if (image.name && image.name.toLowerCase().endsWith('.jpg')) {
          extension = '.jpg';
        }
        const filename = image.name ? image.name : `downloaded_image${extension}`;
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.isLoading2 = false;
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => {
        this.isLoading2 = false;
        console.error('Download request failed:', err);
      }
    });
    }
    openShareModal(image: any, event: Event) {
      this.showShareModal = true;
      event.stopPropagation();
      this.selectedImageUrl = image.url;
    }
    
    closeShareModal() {
      this.showShareModal = false;
    }
    
    shareTo(platform: string,) {
      const shareLinks : any = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.selectedImageUrl)}`,
        x: `https://x.com/intent/post?url=${encodeURIComponent(this.selectedImageUrl)}&text=Check%20this%20out!`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(this.selectedImageUrl)}`,
        instagram: `https://www.instagram.com/?url=${encodeURIComponent(this.selectedImageUrl)}`,
        reddit: `https://www.reddit.com/submit?url=${encodeURIComponent(this.selectedImageUrl)}&title=Cool%20Image`,
        URL: this.selectedImageUrl
      };
    
      window.open(shareLinks[platform], "_blank");
    }

}
