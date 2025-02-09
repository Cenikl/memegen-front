import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { GalleryService } from '../../service/gallery/gallery.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  images: any[] = [];
  loading: boolean = true;
  errorMessage: string = '';
  // Used for the modal view
  previewImage: any = null;

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

  // Navigate to the editor (for new image uploads)
  uploadImage(): void {
    this.router.navigate(['/editor']);
  }

  // Trigger delete request for an image.
  // The second parameter ($event) is used to stop event propagation.
  deleteImage(image: any, event: MouseEvent): void {
    event.stopPropagation();
    this.galleryService.deleteFile(this.cookieService.get("auth_token"),image.url).subscribe({
      next: () => {
        this.images = this.images.filter(img => img.url !== image.url);
      },
      error: (err) => {
        console.error('Failed to delete image:', err);
      }
    });
  }

  // Navigate to the editor while passing the selected image.
  // This assumes your editor can read the navigation state.
  updateImage(image: any, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/editor'], { state: { image } });
  }

  // Open the modal view to display the full image.
  viewImage(image: any, event: MouseEvent): void {
    event.stopPropagation();
    this.previewImage = image;
  }

  // Close the modal view when clicking on the dark background.
  closeViewModal(event: MouseEvent): void {
    // Only close if the click is on the modal container itself (and not the image).
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.previewImage = null;
    }
  }

  // Download the image by programmatically creating an anchor element.
  downloadImage(image: any, event: MouseEvent): void {
    event.stopPropagation();
    this.galleryService.downloadFile(this.cookieService.get('auth_token'),image.url).subscribe({
      next: (response) => {
        console.log('Download triggered successfully', response);
      },
      error: (err) => {
        console.error('Download request failed:', err);
      }
    });
    }
}
