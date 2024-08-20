import { Test, TestingModule } from '@nestjs/testing'
import { AuthorsPrismaRepository } from '../repositories/authors-prisma.repository'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { DeleteAuthorUsecase } from './delete-author.usecase'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { AuthorDataBuilder } from '../helpers/author-data-builder'

describe('GetAuthorUsecase integration tests', () => {
  let module: TestingModule
  let repository: AuthorsPrismaRepository
  let usecase: DeleteAuthorUsecase.Usecase
  const prisma = new PrismaClient()

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as any)
    usecase = new DeleteAuthorUsecase.Usecase(repository)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  test('should throw an error when id is not found', async () => {
    await expect(() =>
      usecase.execute({ id: 'Fake id' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('should be able to delete an author', async () => {
    const data = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })

    const result = await usecase.execute({ id: author.id })
    expect(result).toStrictEqual(author)

    const authors = await prisma.author.findMany()
    expect(authors).toHaveLength(0)
  })
})
