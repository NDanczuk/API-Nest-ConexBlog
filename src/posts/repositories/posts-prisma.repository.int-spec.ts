import { Test, TestingModule } from '@nestjs/testing'
import { execSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { NotFoundError } from '@/shared/errors/not-found-error'
import { PostsPrismaRepository } from './posts-prisma.repository'
import { PostsDataBuilder } from '../helpers/posts-data-builder'
import { AuthorDataBuilder } from '@/authors/helpers/author-data-builder'

describe('PostsPrismaRepository integration tests', () => {
  let module: TestingModule
  let repository: PostsPrismaRepository
  const prisma = new PrismaClient()

  beforeAll(async () => {
    execSync('npm run prisma:migratetest')
    await prisma.$connect()
    module = await Test.createTestingModule({}).compile()
    repository = new PostsPrismaRepository(prisma as any)
  })

  beforeEach(async () => {
    await prisma.post.deleteMany()
    await prisma.author.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  // findById
  test('should throw an error when the id is not found', async () => {
    await expect(repository.findById('Fake ID')).rejects.toThrow(
      new NotFoundError('Post not found using ID Fake ID'),
    )
  })

  test('should find post by id', async () => {
    const postData = PostsDataBuilder({})
    const authorData = AuthorDataBuilder({})
    const author = await prisma.author.create({ data: authorData })

    const post = await prisma.post.create({
      data: {
        ...postData,
        author: {
          connect: { ...author },
        },
      },
    })

    const result = await repository.findById(post.id)
    expect(result).toStrictEqual(post)
  })

  //Create
  test('should create a new post', async () => {
    const postData = PostsDataBuilder({})
    const authorData = AuthorDataBuilder({})
    const author = await prisma.author.create({ data: authorData })

    const result = await repository.create({ ...postData, authorId: author.id })
    expect(result).toMatchObject(postData)
  })

  // Update
  test('should throw an error when updating and the id is not found', async () => {
    const data = PostsDataBuilder({})
    const post = {
      ...data,
      id: 'Fake ID',
      authorId: 'Fake ID',
    }
    await expect(repository.update(post)).rejects.toThrow(
      new NotFoundError('Post not found using ID Fake ID'),
    )
  })

  test('should update a post', async () => {
    const postData = PostsDataBuilder({})
    const authorData = AuthorDataBuilder({})
    const author = await prisma.author.create({ data: authorData })

    const post = await repository.create({ ...postData, authorId: author.id })
    const result = await repository.update({
      ...post,
      published: true,
      title: 'Updated title',
    })
    expect(result.published).toEqual(true)
    expect(result.title).toEqual('Updated title')
  })

  // findBySlug
  test('should return null when no post is found with provided slug', async () => {
    const result = await repository.findBySlug('fake-slug-data')
    expect(result).toBeNull()
  })

  test('should find post by slug', async () => {
    const postData = PostsDataBuilder({})
    const authorData = AuthorDataBuilder({})
    const author = await prisma.author.create({ data: authorData })

    const post = await prisma.post.create({
      data: {
        ...postData,
        author: {
          connect: { ...author },
        },
      },
    })

    const result = await repository.findBySlug(post.slug)
    expect(result).toStrictEqual(post)
  })
})
