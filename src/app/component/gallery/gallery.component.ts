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
  previewImage: any = null;
  showShareModal = false;
  selectedImageUrl: string = '';

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
        console.log(data)
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
      next: (blob : Blob) => {
        let extension = '.png';
        if (image.name && image.name.toLowerCase().endsWith('.jpeg')) {
          extension = '.jpeg';
        } else if (image.name && image.name.toLowerCase().endsWith('.jpg')) {
          extension = '.jpg';
        }
        // Use the image name if available or a default filename.
        const filename = image.name ? image.name : `downloaded_image${extension}`;
        console.log(extension)
        console.log(image.name)

        // Create an object URL for the Blob
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (err) => {
        console.error('Download request failed:', err);
      }
    });
    }
    openShareModal(image: any, event: Event) {
      event.stopPropagation();
      this.selectedImageUrl = image.url;
      this.showShareModal = true;
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
