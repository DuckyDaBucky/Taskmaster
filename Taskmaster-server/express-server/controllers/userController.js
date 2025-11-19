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
        
        console.log("Signup request received:", { userName, firstName, lastName, email });
    
        // Validate required fields
        if (!userName || !firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
    
        //No duplicates check for email or username
        const checkUserEmail = await User.findOne({email});
        const checkUserName = await User.findOne({userName});
    
        if(checkUserName){
          console.log("Username already taken:", userName);
          return res.status(400).json({message: "Username already taken"});
        }

        if(checkUserEmail){
          console.log("Email already taken:", email);
          return res.status(400).json({message: "Email already taken"});
        }
    
        const salt = await bcrypt.genSalt(10); //Protect against dictionary attack
        const hashedPassword = await bcrypt.hash(password, salt); //Hash password with salt
        const newUser = new User({ userName, firstName, lastName, password: hashedPassword, email });
        
        console.log("Saving user to MongoDB...");
        const savedUser = await newUser.save();
        console.log("User saved successfully:", savedUser._id);
    
        const token = savedUser.generateAuthToken();
        console.log("Token generated, returning to client");
        return res.status(201).send( token ); //Return token using usermodel gen token
      } catch (error) {
        console.error("Error creating user:", error);
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

//UPDATE current user profile (authenticated user) - ENFORCE OWNERSHIP
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user?._id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { firstName, lastName, pfp } = req.body;
        
        // Only allow updating firstName, lastName, and pfp (not userName or email for security)
        const update = {};
        if (firstName !== undefined) update.firstName = firstName;
        if (lastName !== undefined) update.lastName = lastName;
        if (pfp !== undefined) update.pfp = pfp;
        
        const updatedProfile = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');

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
        const userId = req.user?._id; // Get from auth middleware
        const friendId = req.params.friendid;
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // ENFORCE: Users can only add friends to their own account
        const requestedUserId = req.params.userid;
        if (requestedUserId !== userId.toString()) {
            return res.status(403).json({ message: "Access denied. You can only add friends to your own account." });
        }

        const curUser = await User.findById(userId);
        if (!curUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const friend = await User.findById(friendId);
        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        // Prevent self-friending
        if (userId.toString() === friendId) {
            return res.status(400).json({ message: "Cannot add yourself as a friend" });
        }

        const updatedProfile = await User.findOneAndUpdate(
            {_id: userId},
            { $addToSet: { friendsList: friendId } },
            { new: true }
        );
        
        const friendProfile = await User.findOneAndUpdate(
            {_id: friendId},
            { $addToSet: { friendsList: userId } },
            { new: true }
        );
        
        res.status(200).json(updatedProfile);

    } catch (error) {
        console.error("❌ Error adding friend:", error);
        res.status(500).json({ message: error.message });
    }
}

// Special function to add "Hamiz Iqbal" as a friend
const addHamizAsFriend = async (req, res) => {
    try {
        const userId = req.user?._id;
        
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Find or create Hamiz Iqbal
        let hamiz = await User.findOne({ $or: [{ userName: "hamiz_iqbal" }, { email: "hamiz@taskmaster.com" }] });
        
        if (!hamiz) {
            // Create Hamiz Iqbal if he doesn't exist
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("password123", salt);
            
            hamiz = new User({
                userName: "hamiz_iqbal",
                firstName: "Hamiz",
                lastName: "Iqbal",
                email: "hamiz@taskmaster.com",
                password: hashedPassword,
            });
            await hamiz.save();
            console.log("✅ Created Hamiz Iqbal user");
        }

        // Check if already friends
        const currentUser = await User.findById(userId);
        if (currentUser.friendsList && currentUser.friendsList.includes(hamiz._id)) {
            return res.status(200).json({ 
                message: "Hamiz Iqbal is already your friend",
                user: currentUser 
            });
        }

        // Add Hamiz to current user's friends list
        const updatedUser = await User.findOneAndUpdate(
            {_id: userId},
            { $addToSet: { friendsList: hamiz._id } },
            { new: true }
        ).select('-password');

        // Add current user to Hamiz's friends list
        await User.findOneAndUpdate(
            {_id: hamiz._id},
            { $addToSet: { friendsList: userId } },
            { new: true }
        );

        res.status(200).json({ 
            message: "Hamiz Iqbal added as friend successfully",
            user: updatedUser 
        });

    } catch (error) {
        console.error("❌ Error adding Hamiz as friend:", error);
        res.status(500).json({ message: error.message });
    }
}


export {
    getUserbyEmail,
    updateProfile,
    updateMyProfile,
    deleteUser,
    createUser,
    getUserByME,
    getUserbyId,
    addFriend,
    addHamizAsFriend
}