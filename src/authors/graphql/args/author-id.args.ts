import { ArgsType, Field, Int } from '@nestjs/graphql'

@ArgsType()
export class AuthorIdArgs {
  @Field()
  id: string
}
