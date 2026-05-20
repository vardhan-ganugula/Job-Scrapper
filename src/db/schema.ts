import { index, pgTable, varchar, uuid, uniqueIndex, date} from 'drizzle-orm/pg-core'; 
import { type InferInsertModel } from 'drizzle-orm';



export type InsertJob = InferInsertModel<typeof jobs>;

export const jobs = pgTable('jobs', {
    id : uuid('id').primaryKey().defaultRandom(),
    jobTitle : varchar('job_title', { length: 255 }).notNull(),
    companyName : varchar('company_name', { length: 255 }).notNull(),
    location : varchar('location', { length: 255 }).notNull(),
    description : varchar('description', { length: 10000 }).notNull(),
    applicants : varchar('applicants', { length: 255 }).notNull(),
    postedTime : varchar('posted_time', { length: 255 }).notNull(),
    url : varchar('url', { length: 1000 }).notNull(),
    unqURL: varchar('unq_url', { length: 1000 }).notNull().unique(),
    fetchedAt: date('fetched_at').notNull().defaultNow(),
}, 
(table) => {
    return {
        unqURLIdx: uniqueIndex('unq_url_idx').on(table.unqURL),
        company: index('company_idx').on(table.companyName),
    }
})

export const users = pgTable('users', {
    id : uuid('id').primaryKey().defaultRandom(),
    name : varchar('name', { length: 255 }).notNull(),
    email : varchar('email', { length: 255 }).notNull().unique(),
    password : varchar('password', { length: 255 }).notNull(),
    resumeText: varchar('resume_text', { length: 5000 }).notNull(),
}, (table) => {
    return {
        emailIdx: uniqueIndex('email_idx').on(table.email)
    }
})