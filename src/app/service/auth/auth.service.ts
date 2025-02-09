import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments.prod';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/login?username=${username}&password=${password}`, null);
  }

  register(username: string, password: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/register?username=${username}&password=${password}`, null);
  }

  findUser(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/find-user?username=${username}`);
  }

  resetPassword(username: string, password: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reset-password?username=${username}&password=${password}`,null);
  }
}

