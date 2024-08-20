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
    await expect(repository.findById('Fake ID')).rejects.toThrow(
      new NotFoundError('Author not found using ID Fake ID'),
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

  //Update
  test('should throw an error at update when the author is not found by id', async () => {
    const data = AuthorDataBuilder({})
    const author = {
      id: 'Fake ID',
      ...data,
    }
    await expect(repository.update(author)).rejects.toThrow(
      new NotFoundError('Author not found using ID Fake ID'),
    )
  })

  test('should update an author', async () => {
    const data = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })

    const result = await repository.update({
      ...author,
      name: 'new name',
    })

    expect(result.name).toBe('new name')
  })

  //Delete
  test('should throw an error at delete when the author is not found by id', async () => {
    await expect(repository.delete('Fake ID')).rejects.toThrow(
      new NotFoundError('Author not found using ID Fake ID'),
    )
  })

  test('should delete an author', async () => {
    const data = AuthorDataBuilder({})
    const author = await prisma.author.create({ data })

    const result = await repository.delete(author.id)

    expect(result).toMatchObject(author)
  })

  //Find by email
  test('should return null when does not find an author with provided email', async () => {
    const result = await repository.findByEmail('a@a.com')
    expect(result).toBeNull()
  })

  test('should find an author by email', async () => {
    const data = AuthorDataBuilder({ email: 'a@a.com' })
    const author = await prisma.author.create({ data })

    const result = await repository.findByEmail('a@a.com')

    expect(result).toMatchObject(author)
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

      result.items.reverse().forEach((item, index) => {
        expect(item.email).toEqual(`author${index + 1}@a.com`)
      })
    })

    test('should apply pagination and ordenation', async () => {
      const createdAt = new Date()
      const data = []
      const arrange = 'badec'
      arrange.split('').forEach((element, index) => {
        const timestamp = createdAt.getTime() + index
        data.push({
          ...AuthorDataBuilder({ name: element }),
          email: `author${index}@a.com`,
          createdAt: new Date(timestamp),
        })
      })

      await prisma.author.createMany({ data })
      const result1 = await repository.search({
        page: 1,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
      })

      expect(result1.items[0]).toMatchObject(data[1])
      expect(result1.items[1]).toMatchObject(data[0])

      const result2 = await repository.search({
        page: 2,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
      })

      expect(result2.items[0]).toMatchObject(data[4])
      expect(result2.items[1]).toMatchObject(data[2])
    })

    test('should apply pagination, filter and ordenation', async () => {
      const createdAt = new Date()
      const data = []
      const arrange = ['test', 'a', 'TEST', 'b', 'Test']
      arrange.forEach((element, index) => {
        const timestamp = createdAt.getTime() + index
        data.push({
          ...AuthorDataBuilder({ name: element }),
          email: `author${index}@a.com`,
          createdAt: new Date(timestamp),
        })
      })

      await prisma.author.createMany({ data })
      const result1 = await repository.search({
        page: 1,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
        filter: 'TEST',
      })

      expect(result1.items[0]).toMatchObject(data[0])
      expect(result1.items[1]).toMatchObject(data[4])

      const result2 = await repository.search({
        page: 2,
        perPage: 2,
        sort: 'name',
        sortDir: 'asc',
        filter: 'TEST',
      })

      expect(result2.items[0]).toMatchObject(data[2])
      expect(result2.items.length).toBe(1)
    })
  })
})
