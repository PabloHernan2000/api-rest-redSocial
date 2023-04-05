const Follow = require("../models/follow.model")
const followUserIds = async (identityUserId) => {

    try {
        //Ususarios que sigue la persona identificada
        let following = await Follow.find({ "user": identityUserId }).select({ "_id": 0, "followed": 1 }).exec();

        //Ususarios que siguen a la persona identificada
        let followers = await Follow.find({ "followed": identityUserId }).select({ "_id": 0, "user": 1 }).exec();

        //Procesar array de identificadores
        let followingClean = [];

        following.forEach(follow => {
            followingClean.push(follow.followed)
        });

        let followersClean = [];

        followers.forEach(follow => {
            followersClean.push(follow.user)
        });

        return {
            following: followingClean,
            followers: followersClean
        }
    } catch (error) {
        return {};
    }
}

const followThisUser = async (identityUserId, profileUserId) => {

    //Saber si el usuario identificado sigue a otro
    let following = await Follow.findOne({ "user": identityUserId, "followed": profileUserId });

    //Ususarios que siguen a la persona identificada
    let follower = await Follow.findOne({ "user": profileUserId , "followed": identityUserId  });

    return {
        following,
        follower
    }

}

module.exports = {
    followUserIds,
    followThisUser
}