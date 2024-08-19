import { Author } from '@prisma/client'
import { ICreateAuthor } from './create-author'
import { IUpdateAuthor } from './update-author'

export type SearchParams = {
  page?: number
  perPage?: number
  filter?: string
  sort?: string
  sortDir?: 'asc' | 'desc'
}

export type SearchResult = {
  items: Author[]
  currentPage: number
  perPage: number
  lastPage: number
  total: number
}

export interface IAuthorsRepository {
  sortableFields: []

  create(data: ICreateAuthor): Promise<Author>
  update(author: IUpdateAuthor): Promise<Author>
  delete(id: string): Promise<Author>
  findById(id: string): Promise<Author>
  findByEmail(email: string): Promise<Author>
  search(params: SearchParams): Promise<SearchResult>
  get(id: string): Promise<Author>
}
