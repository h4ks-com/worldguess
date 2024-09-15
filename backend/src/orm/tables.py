from typing import List, Optional

from geoalchemy2 import Geometry, WKBElement
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    ...


class Countries(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String)

    geometry: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="POLYGON"))


class Population(Base):
    __tablename__ = "population"

    id: Mapped[int] = mapped_column(primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"))
    population: Mapped[int] = mapped_column(Integer)
    geometry: Mapped[WKBElement] = mapped_column(Geometry(geometry_type="POINT"))
