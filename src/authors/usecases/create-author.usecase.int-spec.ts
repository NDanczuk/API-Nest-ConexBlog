import { Test, TestingModule } from '@nestjs/testing'
import { AuthorsPrismaRepository } from '../repositories/authors-prisma.repository'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { AuthorDataBuilder } from '../helpers/author-data-builder'
import { CreateAuthorUsecase } from './create-autor.usecase'

describe('AuthorsPrismaRepository integration tests', () => {
  let module: TestingModule
  let repository: AuthorsPrismaRepository
  let usecase: CreateAuthorUsecase.Usecase
  const prisma = new PrismaClient()

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as any)
    usecase = new CreateAuthorUsecase.Usecase(repository)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  test('should find an author', async () => {
    const data = AuthorDataBuilder({})

    const author = await usecase.execute(data)

    expect(author.id).toBeDefined()
    expect(author.createdAt).toBeInstanceOf(Date)
    expect(author).toMatchObject(data)
  })
})
