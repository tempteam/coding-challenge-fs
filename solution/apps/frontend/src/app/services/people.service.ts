import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PeopleDto, QueryParams, ResponseDto } from '@solution/shared';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PeopleService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/people'; // move to env

  getPeople(params: QueryParams): Observable<ResponseDto<PeopleDto[]>> {
    return this.httpClient.get<ResponseDto<PeopleDto[]>>(this.baseUrl, {
      params,
    });
  }
}
