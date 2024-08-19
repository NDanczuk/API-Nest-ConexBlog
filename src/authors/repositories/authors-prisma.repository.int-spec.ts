import { Test, TestingModule } from '@nestjs/testing'
import { AuthorsPrismaRepository } from './authors-prisma.repository'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { AuthorDataBuilder } from '../helpers/author-data-builder'

describe('AuthorsPrismaRepository integration tests', () => {
  let module: TestingModule
  let repository: AuthorsPrismaRepository
  const prisma = new PrismaClient()

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new AuthorsPrismaRepository(prisma as any)
  })

  beforeEach(async () => {
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  // findById
  test('should throw an error when the id is not found', async () => {
    await expect(repository.findById('Wrong ID')).rejects.toThrow(
      new NotFoundError('Author not found using ID Wrong ID'),
    )
  })

  test('should throw an error when the id is not found', async () => {
    const data = AuthorDataBuilder({})
    const author = await prisma.author.create({
      data,
    })

    const result = await repository.findById(author.id)
    expect(result).toStrictEqual(author)
  })
})
