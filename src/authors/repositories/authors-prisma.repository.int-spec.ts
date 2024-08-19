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

  test('should find an author', async () => {
    const data = AuthorDataBuilder({})

    const author = await prisma.author.create({
      data,
    })

    const result = await repository.findById(author.id)
    expect(result).toStrictEqual(author)
  })

  //Create
  test('should find an author', async () => {
    const data = AuthorDataBuilder({})

    const author = await repository.create(data)

    expect(author).toMatchObject(data)
  })

  //Search
  describe('search method', () => {
    test('should only apply pagination when params are null', async () => {
      const createdAt = new Date()
      const data = []
      const arrange = Array(16).fill(AuthorDataBuilder({}))
      arrange.forEach((element, index) => {
        const timestamp = createdAt.getTime() + index
        data.push({
          ...element,
          email: `author${index}@a.com`,
          createdAt: new Date(timestamp),
        })
      })

      await prisma.author.createMany({ data })
      const result = await repository.search({})

      expect(result.total).toBe(16)
      expect(result.items.length).toBe(15)

      result.items.forEach(item => {
        expect(item.id).toBeDefined()
      })
    })
  })
})
