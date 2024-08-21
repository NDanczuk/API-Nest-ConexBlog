import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql'
import { Post } from '../models/post'
import { CreatePostUseCase } from '@/posts/usecases/create-post.usecase'
import { Inject } from '@nestjs/common'
import { CreatePostInput } from '../inputs/create-post.input'
import { GetAuthorUsecase } from '@/authors/usecases/get-author.usecase'

@Resolver(() => Post)
export class PostsResolver {
  @Inject(CreatePostUseCase.UseCase)
  private createPostUseCase: CreatePostUseCase.UseCase

  @Inject(GetAuthorUsecase.Usecase)
  private getAuthorUsecase: GetAuthorUsecase.Usecase

  @Mutation(() => Post)
  createPost(@Args('data') data: CreatePostInput) {
    return this.createPostUseCase.execute(data)
  }

  @ResolveField()
  author(@Parent() post: Post) {
    return this.getAuthorUsecase.execute({ id: post.authorId })
  }
}
