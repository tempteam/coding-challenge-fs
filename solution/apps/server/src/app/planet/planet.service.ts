import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PlanetDto, planetSchema } from '@solution/shared';
import { lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class PlanetService {
  constructor(private readonly httpService: HttpService) {}

  async getPlanet(url: string): Promise<PlanetDto> {
    const planetData = await this.fetchPlanetDetails(url);
    const validatedPlanet = planetSchema.parse({
      name: planetData.name,
      terrain: planetData.terrain,
    });

    return validatedPlanet;
  }

  private async fetchPlanetDetails(url: string): Promise<PlanetDto> {
    const {
      result: { properties },
    } = await this.fetchFromApi<{ result: { properties: PlanetDto } }>(url);
    return properties;
  }

  private async fetchFromApi<T>(url: string): Promise<T> {
    try {
      return await lastValueFrom(
        this.httpService.get<T>(url).pipe(
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
