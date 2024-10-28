import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PlanetService } from '../planet/planet.service';
import { PeopleDto, peopleSchema, ResponseDto } from '@solution/shared';
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
/*
people
{
  "total_records": 82,
  "total_pages": 9,
  "results": [
    {
      "uid": "1",
      "name": "Luke Skywalker",
      "url": "https://www.swapi.tech/api/people/1"
    }
  ]
}

people/:id
{
  "result": {
    "properties": {
      "height": "172",
      "mass": "77",
      "hair_color": "blond",
      "skin_color": "fair",
      "eye_color": "blue",
      "birth_year": "19BBY",
      "gender": "male",
      "created": "2024-10-28T04:07:30.803Z",
      "edited": "2024-10-28T04:07:30.803Z",
      "name": "Luke Skywalker",
      "homeworld": "https://www.swapi.tech/api/planets/1",
      "url": "https://www.swapi.tech/api/people/1"
    },
}

{
  "data": [
    // var 1
    {
      "name": string,
      "birth_year": string,
      "homeworld": {
        "name": string,
        "terrain": string
      }
    },
    // var 2
    {
      "name": string,
      "birth_year": string,
      "homeworld": string,
      "terrain": string
    }
  ],
  "totalRecords": number,
  "totalPages": number
}
*/

type SwapiPeopleResponse = {
  results?: PeopleDto[];
  result?: [{ properties: PeopleDto }];
  total_records?: number;
  total_pages?: number;
};

type QueryParams = Record<string, string>;

@Injectable()
export class PeopleService {
  private apiUrl = process.env.SWAPI_URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly planetService: PlanetService
  ) {}

  async getPeople(params: QueryParams): Promise<ResponseDto<PeopleDto[]>> {
    const { data, totalPages, totalRecords } = await this.fetchPeopleData(
      params
    );

    const detailedPeople = await Promise.all(
      data.map((people) => this.fetchPersonAndPlanet(people))
    );

    return {
      data: detailedPeople,
      totalPages,
      totalRecords,
    };
  }

  private async fetchPeopleData(
    params: QueryParams
  ): Promise<ResponseDto<PeopleDto[]>> {
    const requestUrl = `${this.apiUrl}/people`;
    const response = await this.fetchFromApi<SwapiPeopleResponse>(
      requestUrl,
      params
    );

    return {
      data: (response.results ?? response.result) as PeopleDto[],
      totalPages: response.total_pages || 1,
      totalRecords: response.total_records || 0,
    };
  }

  private async fetchPersonAndPlanet(people: any): Promise<PeopleDto> {
    const personDetails =
      people.properties || (await this.fetchPersonDetails(people.url));
    const homeworldData = await this.planetService.getPlanet(
      personDetails.homeworld
    );
    const personDTO: PeopleDto = {
      name: personDetails.name,
      birth_year: personDetails.birth_year,
      homeworld: {
        name: homeworldData.name,
        terrain: homeworldData.terrain,
      },
    };

    return peopleSchema.parse(personDTO);
  }

  private async fetchPersonDetails(
    url: string,
    params = {}
  ): Promise<PeopleDto> {
    const response = await this.fetchFromApi<{
      result: { properties: PeopleDto };
    }>(url, params);
    return response.result.properties;
  }

  private async fetchFromApi<T>(url: string, params = {}): Promise<T> {
    try {
      return await lastValueFrom(
        this.httpService.get<T>(url, { params }).pipe(
          map((res) => res.data),
          catchError((error) => {
            throw new HttpException(
              `Failed to fetch data from SWAPI: ${error.message}`,
              HttpStatus.BAD_GATEWAY
            );
          })
        )
      );
    } catch (error) {
      throw new HttpException(
        `Error fetching SWAPI data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
