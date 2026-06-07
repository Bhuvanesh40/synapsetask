import db from '../lib/db'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables immediately
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

async function testRegister() {
  console.log('🔄 Testing registration transaction against Neon DB...')
  
  const name = 'Test User'
  const email = `test-${Math.floor(1000 + Math.random() * 9000)}@test.com`
  const password = 'password123'
  
  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })
      console.log('👉 User record created inside transaction:', user.id)

      let slug = `test-user-${Math.floor(1000 + Math.random() * 9000)}-workspace`
      
      const workspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug,
          members: {
            create: {
              userId: user.id,
              role: 'ADMIN',
            },
          },
        },
      })
      console.log('👉 Workspace record created inside transaction:', workspace.id)
      
      return user
    })

    console.log('✅ Registration Transaction Completed Successfully! User ID:', newUser.id)
  } catch (error: any) {
    console.error('❌ Registration Transaction Failed!')
    console.error(error)
  }
}

testRegister()
