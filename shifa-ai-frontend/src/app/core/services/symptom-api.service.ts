import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DiseaseSummary, HealthResponse, SymptomSearchRequest } from '../models/health-response.model';

@Injectable({ providedIn: 'root' })
export class SymptomApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  search(request: SymptomSearchRequest): Observable<HealthResponse> {
    return this.http.post<HealthResponse>(`${this.baseUrl}/search`, request);
  }

  getDiseases(): Observable<DiseaseSummary[]> {
    return this.http.get<DiseaseSummary[]>(`${this.baseUrl}/diseases`);
  }

  getDiseaseById(id: string): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/diseases/${id}`);
  }
}
