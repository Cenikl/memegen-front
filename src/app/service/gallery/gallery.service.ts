import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments.prod';

export interface ImageDto {
  name: string;
  imageOwner: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getImages(token: string): Observable<ImageDto[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ImageDto[]>(`${this.apiUrl}/images`, { headers });
  }

  uploadFile(token: string, formData: FormData): Observable<ImageDto> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<ImageDto>(`${this.apiUrl}/image/send`, formData, { headers });
  }

  updateFile(token: string, url: string, ): Observable<ImageDto> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ImageDto>(`${this.apiUrl}/image/update`, { headers });
  }

  deleteFile(token : string, imageUrl: string): Observable<ImageDto> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${this.apiUrl}/image/delete?imageUrl=${imageUrl}`,null, { headers });
  }

  downloadFile(token : string, url: string): Observable<Blob> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(
      `${this.apiUrl}/image/download?imageUrl=${encodeURIComponent(url)}`,
       { headers, responseType: 'blob' });
  }

}
