import { PostOutput } from '../dto/post-output'
import { PostsPrismaRepository } from '../repositories/posts-prisma.repository'
import { BadRequestError } from '@/shared/errors/bad-request-error'
import slugify from 'slugify'
import { ConflictError } from '@/shared/errors/conflict-error'

export namespace GetPostUseCase {
  export type Input = {
    id: string
  }

  export type Output = PostOutput

  export class UseCase {
    constructor(private postsRepository: PostsPrismaRepository) {}

    async execute(input: Input): Promise<Output> {
      const post = await this.postsRepository.findById(input.id)
      return post as PostOutput
    }
  }
}
