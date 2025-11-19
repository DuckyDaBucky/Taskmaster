import User from '../models/userModel.js';
import bcrypt from 'bcrypt';

//GET User by email, /:email
const getUserbyEmail = async (req, res) => {
    try {
        const user = await User.findOne({email: req.params.email}).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Email not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

//GET User by id, /:id
const getUserbyId = async (req, res) => {
    try {
        const user = await User.findOne({_id: req.params.userid}).select("-password");
        if (!user) {
            return res.status(404).json({ message: "UserID not found" });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


//GET user id using token, use auth middleware first to decipher token and store in user field
const getUserByME = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password'); //return everything except hashed password
    res.send(user);
}

//POST User (Sign up only)
const createUser = async (req, res) => {
    try {
        const { userName, firstName, lastName, password, email } = req.body;
    
        //No duplicates check for email or username
        const checkUserEmail = await User.findOne({email});
        const checkUserName = await User.findOne({userName});
    
        if(checkUserName){
          return res.status(400).json({message: "Username already taken"});
        }

        if(checkUserEmail){
          return res.status(400).json({message: "Email already taken"});
        }
    
        const salt = await bcrypt.genSalt(10); //Protect against dictionary attack
        const hashedPassword = await bcrypt.hash(password, salt); //Hash password with salt
        const newUser = new User({ userName, firstName, lastName, password: hashedPassword, email });
        const savedUser = await newUser.save();
    
        const token = savedUser.generateAuthToken();
        return res.status(201).send( token ); //Return token using usermodel gen token
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
};

//UPDATE user by id using req body changes, /:id
const updateProfile = async (req, res) => {
    try {
        const { userName, firstName, lastName, email, pfp, friendsList} = req.body;
        const update = {
            userName: userName,
            firstName: firstName,
            lastName: lastName,
            email: email,
            pfp: pfp,
            friendsList: friendsList
        };
        const updatedProfile = await User.findOneAndUpdate({_id: req.params.userid}, update,{ new: true });

        if (!updatedProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Delete user, /:id
const deleteUser = async (req, res) => {
    try {
        const deleteUser = await User.findOneAndDelete({_id: req.params.userid});
        if (!deleteUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(deleteUser);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addFriend = async (req, res) => {
    try {
        const curUser = await User.findById({_id: req.params.userid});
        if (!curUser) {
            return res.status(404).json({ message: "Critical Error 404, User not found" });
        }

        const friend = await User.findById({_id: req.params.friendid});
        if (!friend) {
            return res.status(404).json({ message: "Critical Error 404, Friend not found" });
        }

        const updatedProfile = await User.findOneAndUpdate({_id: req.params.userid},{ $addToSet: { friendsList: req.params.friendid } },{ new: true });
        const friendProfile = await User.findOneAndUpdate({_id: req.params.friendid},{ $addToSet: { friendsList: req.params.userid } },{ new: true });
        res.status(200).json(updatedProfile);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export {
    getUserbyEmail,
    updateProfile,
    deleteUser,
    createUser,
    getUserByME,
    getUserbyId,
    addFriend
}