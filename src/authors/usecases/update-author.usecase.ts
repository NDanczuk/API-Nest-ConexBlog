import { Author } from '@prisma/client'
import { AuthorOutput } from '../dto/author-output'
import { AuthorsPrismaRepository } from '../repositories/authors-prisma.repository'
import { ConflictError } from '@/shared/errors/conflict-error'
import { BadRequestError } from '@/shared/errors/bad-request-error'

export namespace UpdateAuthorUsecase {
  export type Input = Partial<Author>

  export type Output = AuthorOutput

  export class Usecase {
    constructor(private authorsRepository: AuthorsPrismaRepository) {}

    async execute(input: Input): Promise<Output> {
      if (!input?.id) {
        throw new BadRequestError('ID not provided')
      }

      const author = await this.authorsRepository.findById(input.id)

      if (input.email) {
        const emailExists = await this.authorsRepository.findByEmail(
          input.email,
        )
        if (emailExists && emailExists.id !== input.id) {
          throw new ConflictError('Email address already in use')
        }
        author.email = input.email
      }

      if (input.name) {
        author.name = input.name
      }

      return this.authorsRepository.update(author)
    }
  }
}
