import { Test, TestingModule } from '@nestjs/testing'
import { AuthorsPrismaRepository } from '../repositories/authors-prisma.repository'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { UpdateAuthorUsecase } from './update-author.usecase'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { AuthorDataBuilder } from '../helpers/author-data-builder'
import { BadRequestError } from '@/shared/errors/bad-request-error'
import { ConflictError } from '@/shared/errors/conflict-error'

describe('UpdateAuthorUsecase integration tests', () => {
  let module: TestingModule
  let repository: AuthorsPrismaRepository
  let usecase: UpdateAuthorUsecase.Usecase
  const prisma = new PrismaClient()

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as any)
    usecase = new UpdateAuthorUsecase.Usecase(repository)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  test('should throw an error when id is not provided', async () => {
    const input = {
      id: null,
    }
    await expect(() => usecase.execute(input)).rejects.toBeInstanceOf(
      BadRequestError,
    )
  })

  test('should throw an error provided email is already in use', async () => {
    const data = AuthorDataBuilder({ email: 'a@a.com' })
    const firstAuthor = await prisma.author.create({ data })
    const secondAuthor = await prisma.author.create({
      data: AuthorDataBuilder({}),
    })

    secondAuthor.email = 'a@a.com'
    await expect(() => usecase.execute(secondAuthor)).rejects.toBeInstanceOf(
      ConflictError,
    )
  })

  test('should be able to update author', async () => {
    const data = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })

    const result = await usecase.execute({
      ...author,
      name: 'Updated name',
      email: 'a@a.com',
    })
    expect(result.name).toEqual('Updated name')
    expect(result.email).toEqual('a@a.com')
  })
})
