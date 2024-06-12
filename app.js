const express = require('express')
const app = express()
const path = require('path')

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const DbPath = path.join(__dirname, 'userData.db')

let database = null
app.use(express.json())
const bcrypt = require('bcrypt')

const initializeServerAndDatabase = async () => {
  try {
    database = await open({
      filename: DbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running in http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB ERROR:${e.message}')
  }
}

initializeServerAndDatabase()

/*{
  "username": "adam_richard",
  "name": "Adam Richard",
  "password": "richard_567",
  "gender": "male",
  "location": "Detroit"
}*/

//
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`
  const userQueryResponse = await database.get(userQuery)

  if (userQueryResponse === undefined) {
    const insertUserQuery = `INSERT 
    INTO 
    user 
    (username,name,password,gender,location) 
    VALUES 
    ('${username}','${name}','${hashedPassword}','${gender}','${location}');`
    if (password.length > 4) {
      const insertUserQueryResponse = database.run(insertUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const verifyUserNameQuery = `SELECT * FROM user WHERE username = '${username}';`
  const verifyUserNameQueryResponse = await database.get(verifyUserNameQuery)
  if (verifyUserNameQueryResponse === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      verifyUserNameQueryResponse.password,
    )
    if (isPasswordMatch === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

/*{
  "username": "adam_richard",
  "oldPassword": "richard_567",
  "newPassword": "richard@123"
}
*/

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const getUserQueryResponse = await database.get(getUserQuery)

  if (getUserQueryResponse === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      getUserQueryResponse.password,
    )
    if (isPasswordMatched === true) {
      if (newPassword.length > 4) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        const updatedPasswordQuery = `
          UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`
        const updatedPasswordQueryResponse =
          await database.run(updatedPasswordQuery)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
