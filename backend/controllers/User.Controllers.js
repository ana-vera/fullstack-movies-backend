import asyncHandler from "express-async-handler"
import colors from 'colors'

import User from '../models/User.Model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const setUser = asyncHandler( async (req, res) => {

    console.log(req.body)
    const {name, email, password} = req.body    

    if (!name || !email || !password) {
        res.status(400)
        throw new Error('Faltan datos')
    }

    const userExists = await User.findOne({email})
    if (userExists) {
        res.status(400)
        throw new Error('Ese correo ya está registrado')
    }

    const salt  = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
        name,
        email,
        password: hashedPassword
    })

    if(user){
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: user.token
        })
    } else{
        res.status(400)
        throw new Error('Invalid data')
    }

})

const loginUser = asyncHandler ( async (req,res) => {
    
    const {email, password} = req.body

    const user = await User.findOne({email})

    console.log(`email  ${email}`.bgCyan)
    console.log(`password  ${password}`.bgMagenta)

    if(user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user.id)
        })
    } else {
        res.status(400)
        throw new Error("Incorrect username or password")
    }
})

const updateUser = asyncHandler( async(req,res)=>{
    const user = await User.findbyId(req.params.id)
    if (!user) {
        res.status(400)
        throw new Error('User not found')
    }

    const userUpdated = await User.findbyIdAndUpdate(req.params.id, req.body, {new: true})
    
    res.status(200).json({userUpdated})
})

const deleteUser = asyncHandler( async (req,res) =>{
        const user = await User.findbyId(req.params.id)
        if(!user){
            res.status(400)
            throw new Error('User not found')
        }
        await user.deleteOne()
        res.status(200).json({id: req.params.id})
})

//users need tokens when they login
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

export {
    loginUser,
    setUser,
    updateUser,
    deleteUser,
    generateToken
}