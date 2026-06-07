import db from '../lib/db'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

async function listUsers() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          include: {
            workspace: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    })
    console.log('=== USERS IN DATABASE ===')
    console.log(JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error listing users:', error)
  }
}

listUsers()
