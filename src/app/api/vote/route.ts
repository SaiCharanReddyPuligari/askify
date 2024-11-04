import { answerCollection, db, questionCollection, voteCollection } from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import {NextResponse, NextRequest } from "next/server";
import { ID, Query } from "node-appwrite";

export async function POST(request:NextRequest) {
    try {

        //grab data
        const {votedById, voteStatus, type, typeId} = await request.json();

        const response = await databases.listDocuments(db, voteCollection,
            [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteById", votedById),
            ]
        )

        if(response.documents.length>0){
        
         await databases.deleteDocument(db,voteCollection,response.documents[0].$id);
         //decrease the reputation
         const QuestionOrAnswer = await databases.getDocument(db,
            type ==="question"?questionCollection: answerCollection,
            typeId
         );

         const authorPrefs = await users.getPrefs<UserPrefs>(QuestionOrAnswer.authorId);

         await users.updatePrefs<UserPrefs>(QuestionOrAnswer.authorId,{
            reputation: response.documents[0].voteStatus==="upvoted"? Number(authorPrefs.reputation) -1 : Number(authorPrefs.reputation)+1
         });
        }

        //if previous does not exist or vote status changes
        if(response.documents[0]?.voteStatus!=voteStatus){
            //
            const doc= await databases.createDocument(db,voteCollection,ID.unique(),{
                type,
                typeId,
                voteStatus,
                votedById
        });

        //inc or dec reputation
        const QuestionOrAnswer = await databases.getDocument(db,
            type ==="question"?questionCollection: answerCollection,
            typeId
         );
        const authorPrefs = await users.getPrefs<UserPrefs>(QuestionOrAnswer.authorId);

         //if vote was preset
         if(response.documents[0]){
            await users.updatePrefs<UserPrefs>(QuestionOrAnswer.authorId,{
                reputation: response.documents[0].voteStatus==="upvoted"? Number(authorPrefs.reputation) -1 : Number(authorPrefs.reputation)+1
                //means prev vote was "upvoted" and new value is "Downvited" so we have to decrease the reputation
             });
         }

        }

        const [upvotes, downvotes] = await Promise.all([
            databases.listDocuments(db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteStatus", "upvoted"),
                Query.equal("votedById", votedById),
                Query.limit(1), // for optimization as we only need total
            ]),
            databases.listDocuments(db, voteCollection, [
                Query.equal("type", type),
                Query.equal("typeId", typeId),
                Query.equal("voteStatus", "downvoted"),
                Query.equal("votedById", votedById),
                Query.limit(1), // for optimization as we only need total
            ]),
        ]);

        return NextResponse.json(
            {
                data: {
                    document: null, voteResult: upvotes.total = downvotes.total
                },
                message: "Vote handled"
            },
            {
                status: 200
            }
        )
        
    } catch (error: any) {
        return NextResponse.json(
            {
              message: error?.message || "Error in voting"
            },
            {
              status: error?.status || error?.code || 500
            }
          )
    }
}