const {User, Book} = require('../models');
const {AuthenticationError} = require('apollo-server-express')
const {signToken}= require('../utils/auth');
const { model } = require('mongoose');

const resolvers = {
    Query:{
        me: async (parent, args, context)=>{
            if(context.user){
                const userData= await User.findOne({_id:context.user._id}).select('-__V -password')
                return userData;
            }
            throw new AuthenticationError('You are not logged in')
        }

    },
    Mutation:{
        addUser: async (parent,args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return{user, token};
        },
        login: async (parnet,{ email, password})=>{
            const user = await User.findOne({email});
            if(!user){
                throw new AuthenticationError('Invalid credentials');
            }
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw){
                throw new AuthenticationError('Invalid credentials');
            }
            const token=signToken(user);
            return {token, user};
        },
        saveBook: async (parent, {bookData}, context) => {
            if (context.user){
                const updatedUser = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$addToSet:{ savedBooks: bookData}},
                    {new:true}
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please log in!')
        },
        removeBook: async (parent, {bookId}, context)=>{
            if (context.user){
                const updatedUser= await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks:{bookId}}},
                    {new: true}
                );
                return updatedUser;
            }
            throw new AuthenticationError('Please log in!')
        },
    },
};

module.exports = resolvers;