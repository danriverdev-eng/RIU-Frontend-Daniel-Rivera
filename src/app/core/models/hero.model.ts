export type HeroStatus = 'Active' | 'Inactive' | 'Retired';

export interface Hero {
  readonly id: string;
  readonly name: string;
  readonly realName: string;
  readonly powers: readonly string[];
  readonly universe: string;
  readonly status: HeroStatus;
}

export type HeroCreateDto = Omit<Hero, 'id'>;
export type HeroUpdateDto = Partial<Omit<Hero, 'id'>>;
