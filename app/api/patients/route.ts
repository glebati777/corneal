import { NextResponse } from "next/server";

let patients: any[] = [];

export async function GET() {
    return NextResponse.json(patients);
}

export async function POST(request: Request) {
    const body = await request.json();
    const newPatient = { id: Date.now(), ...body };
    patients.push(newPatient);

    return NextResponse.json(newPatient);
}